/*
 * (c) Copyright Ascensio System SIA 2010-2024
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */


"use strict";

// Word lays a drawing out, and draws it, at its wp:extent. A locked drawing
// canvas (Word 2007 "Object 1"), a group or a picture can carry another size
// in its own a:xfrm; opening the file must not draw it at that size, or it
// runs over the page margins and the text after it. An inline drawing larger
// than the text column is scaled down, keeping its proportions, never up.
$(function ()
{
	const pageW = 500, pageH = 1000, margin = 50;
	const logicDocument = AscTest.CreateLogicDocument();

	function setupSection()
	{
		AscTest.ClearDocument();
		const sectPr = AscTest.GetFinalSection();
		sectPr.SetPageSize(pageW, pageH);
		sectPr.SetPageMargins(margin, margin, margin, margin);
	}

	function xfrm(offX, offY, extX, extY, chOffX, chOffY, chExtX, chExtY)
	{
		const x = new AscFormat.CXfrm();
		x.setOffX(offX); x.setOffY(offY); x.setExtX(extX); x.setExtY(extY);
		if (chExtX !== undefined)
		{
			x.setChOffX(chOffX); x.setChOffY(chOffY); x.setChExtX(chExtX); x.setChExtY(chExtY);
		}
		return x;
	}

	// a canvas the way Word 2007 writes one: its own size is its canvas size
	// (here 300 x 240), the size on the page (wp:extent) is 200 x 160
	function createCanvasDrawing(Group)
	{
		const drawing = new ParaDrawing(200, 160, null, logicDocument.DrawingDocument, logicDocument, null);
		const group = new Group();
		group.setSpPr(new AscFormat.CSpPr());
		group.spPr.setParent(group);
		group.spPr.setXfrm(xfrm(0, 0, 300, 240, 10, 20, 300, 240));
		group.spPr.xfrm.setParent(group.spPr);
		const drawingObjects = logicDocument.GetDrawingObjects();
		// one shape filling the lower right quarter of the canvas
		const image = drawingObjects.createImage(AscCommon.g_sWordPlaceholderImage, 160, 140, 150, 120);
		image.spPr.setXfrm(xfrm(160, 140, 150, 120));
		image.setGroup(group);
		group.addToSpTree(0, image);
		group.setBDeleted(false);
		group.setParent(drawing);
		drawing.Set_GraphicObject(group);
		return {drawing: drawing, group: group, child: image};
	}

	function paragraphWith(drawing, text)
	{
		const p = AscTest.CreateParagraph();
		p.SetParagraphSpacing({Before : 0, After : 0, LineRule : linerule_Auto, Line : 1});
		const run = new AscWord.CRun();
		p.AddToContent(0, run);
		if (drawing)
			run.AddToContent(0, drawing);
		if (text)
			run.AddText(text);
		return p;
	}

	function close(assert, actual, expected, message)
	{
		assert.ok(Math.abs(actual - expected) < 0.01, message + ": " + actual.toFixed(2) + " (expected " + expected.toFixed(2) + ")");
	}

	QUnit.module("Drawings at their layout size");

	[["group", AscFormat.CGroupShape], ["locked canvas", AscFormat.CLockedCanvas]].forEach(function (c)
	{
		QUnit.test("An inline " + c[0] + " is drawn at its wp:extent, not at its own size", function (assert)
		{
			setupSection();
			const o = createCanvasDrawing(c[1]);
			assert.strictEqual(AscCommonWord.FitGraphicSizeToDrawingExtent(o.drawing), true, "the object's size is brought to wp:extent");
			assert.strictEqual(AscCommonWord.FitGraphicSizeToDrawingExtent(o.drawing), false, "a second call changes nothing");

			const p1 = paragraphWith(o.drawing);
			const p2 = paragraphWith(null, "After");
			logicDocument.PushToContent(p1);
			logicDocument.PushToContent(p2);
			AscTest.Recalculate();

			const b = o.group.bounds;
			close(assert, b.r - b.l, 200, "drawn width");
			close(assert, b.b - b.t, 160, "drawn height");
			close(assert, b.l, margin, "left edge on the left margin");
			assert.ok(b.r <= pageW - margin + 0.01, "right edge inside the right margin");

			// the shape keeps its place in the canvas, scaled by 2/3
			const t = o.child.transform;
			close(assert, t.tx - b.l, (160 - 10) * 2 / 3, "shape x in the canvas");
			close(assert, t.ty - b.t, (140 - 20) * 2 / 3, "shape y in the canvas");
			close(assert, o.child.extX, 100, "shape width");
			close(assert, o.child.extY, 80, "shape height");

			// the text after it starts below what is drawn
			assert.ok(p2.Pages[0].Bounds.Top >= b.b - 0.01, "next paragraph at " + p2.Pages[0].Bounds.Top.toFixed(2) + ", drawing ends at " + b.b.toFixed(2));
		});
	});

	QUnit.test("A picture whose own size differs from wp:extent is drawn at wp:extent", function (assert)
	{
		setupSection();
		const d = AscTest.CreateImage(120, 80);
		d.GraphicObj.spPr.xfrm.setExtX(240);
		d.GraphicObj.spPr.xfrm.setExtY(160);
		assert.strictEqual(AscCommonWord.FitGraphicSizeToDrawingExtent(d), true, "resized");
		logicDocument.PushToContent(paragraphWith(d));
		AscTest.Recalculate();
		close(assert, d.GraphicObj.extX, 120, "width");
		close(assert, d.GraphicObj.extY, 80, "height");
	});

	QUnit.test("Shapes are left alone (they already use wp:extent)", function (assert)
	{
		setupSection();
		const d = AscTest.CreateImage(120, 80);
		const o = createCanvasDrawing(AscFormat.CGroupShape);
		// a group whose size agrees with wp:extent is not touched either
		o.group.spPr.xfrm.setExtX(200);
		o.group.spPr.xfrm.setExtY(160);
		assert.strictEqual(AscCommonWord.FitGraphicSizeToDrawingExtent(o.drawing), false, "group already at wp:extent");
		assert.strictEqual(AscCommonWord.FitGraphicSizeToDrawingExtent(null), false, "no drawing");
		assert.strictEqual(AscCommonWord.FitGraphicSizeToDrawingExtent(d), false, "picture already at wp:extent");
	});

	QUnit.test("An inline drawing wider than the column is scaled down to it when the document is opened", function (assert)
	{
		setupSection();
		const big = AscTest.CreateImage(600, 300);
		const tall = AscTest.CreateImage(200, 1800);
		const small = AscTest.CreateImage(100, 50);
		const full = AscTest.CreateImage(400.3, 100);
		const floating = AscTest.CreateImage(600, 300);
		floating.Set_DrawingType(drawing_Anchor);
		[big, tall, small, full, floating].forEach(function (d)
		{
			logicDocument.PushToContent(paragraphWith(d, "Text"));
		});
		const historyIndex = AscCommon.History.Index;
		const historyPoints = AscCommon.History.Points.length;
		logicDocument.private_FitInlineDrawingsOnEndLoad();
		assert.strictEqual(AscCommon.History.Index, historyIndex, "nothing to undo after opening");
		assert.strictEqual(AscCommon.History.Points.length, historyPoints, "no history points added");
		AscTest.Recalculate();

		close(assert, big.Extent.W, 400, "wide picture: column width");
		close(assert, big.Extent.H, 200, "wide picture: proportional height");
		close(assert, big.GraphicObj.extX, 400, "wide picture drawn at the new width");
		close(assert, tall.Extent.H, 900, "tall picture: page text height");
		close(assert, tall.Extent.W, 100, "tall picture: proportional width");
		close(assert, small.Extent.W, 100, "small picture: not enlarged");
		close(assert, full.Extent.W, 400.3, "picture within half a millimetre of the column: untouched");
		close(assert, floating.Extent.W, 600, "floating picture keeps the size the document gives it");
	});
});
