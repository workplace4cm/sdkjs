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

QUnit.config.autostart = false;

// A resized SmartArt scales its shapes; the text in them has to be fitted to
// the new shape sizes again (as Word does) instead of keeping the font size
// it had and breaking words inside the smaller blocks.
$(function ()
{
	function fontSizes(oSmartArt)
	{
		return oSmartArt.getDrawing().spTree.map(function (oShape)
		{
			const oContent = oShape.getDocContent && oShape.getDocContent();
			if (!oContent)
				return null;
			oContent.SetApplyToAll(true);
			const nSize = oContent.GetCalculatedTextPr().FontSize;
			oContent.SetApplyToAll(false);
			return nSize;
		});
	}

	function setText(oSmartArt, sText)
	{
		oSmartArt.getDrawing().spTree.forEach(function (oShape)
		{
			const oContent = oShape.getDocContent && oShape.getDocContent();
			if (!oContent)
				return;
			oContent.SetApplyToAll(true);
			oContent.Remove(-1);
			oContent.SetApplyToAll(false);
			const oRun = new AscWord.CRun();
			oRun.AddText(sText);
			oContent.Content[0].AddToContent(0, oRun);
			// typed text: the points are no longer placeholders
			(oShape.getSmartArtPointContent() || []).forEach(function (oNode)
			{
				if (oNode.point && oNode.point.prSet)
					oNode.point.prSet.setPhldr(false);
			});
			oShape.copyTextInfoFromShapeToPoint();
		});
	}

	AscTest.CreateLogicDocument();
	AscCommon.g_oBinarySmartArts.checkLoadDrawing().then(function ()
	{
		return AscCommon.g_oBinarySmartArts.checkLoadData(Asc.c_oAscSmartArtTypes.BasicBlockList);
	}).then(function ()
	{
		QUnit.start();
		QUnit.module("SmartArt text after resize");
		QUnit.test("Basic Block List: text is fitted again after the SmartArt is made smaller", function (assert)
		{
			AscFormat.ExecuteNoHistory(function ()
			{
				const oSmartArt = new AscFormat.SmartArt();
				oSmartArt.fillByPreset(Asc.c_oAscSmartArtTypes.BasicBlockList);
				oSmartArt.setBDeleted(false);
				oSmartArt.spPr.xfrm.setExtX(152.4);
				oSmartArt.spPr.xfrm.setExtY(88.9);
				oSmartArt.recalculate();
				setText(oSmartArt, "werwer werwer");
				oSmartArt.recalcFitFontSize();
				oSmartArt.recalculate();
				const arrBefore = fontSizes(oSmartArt);

				// the way the editor resizes a drawing (handles, size fields)
				oSmartArt.changeSize(1 / 3, 1 / 3);
				oSmartArt.recalculate();
				const arrAfter = fontSizes(oSmartArt);

				assert.ok(arrBefore.length > 0 && arrBefore.every(function (n) {return n > 0;}), "font sizes before the resize: " + arrBefore.join(", "));
				for (let i = 0; i < arrBefore.length; i += 1)
				{
					assert.ok(arrAfter[i] < arrBefore[i], "block " + i + ": " + arrBefore[i] + "pt before, " + arrAfter[i] + "pt after");
				}

				oSmartArt.changeSize(3, 3);
				oSmartArt.recalculate();
				assert.deepEqual(fontSizes(oSmartArt), arrBefore, "back to the original size: the original font sizes");
			}, this, []);
		});
	});
});
