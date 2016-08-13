/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mail utility functions for GMail Conversation View
 *
 * The Initial Developer of the Original Code is
 * Jonathan Protzenko
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * @fileoverview A whole bunch of utility functions that will abstract away
 *  various low-level nsIMsgDbHdr operations. The idea is to save time by not
 *  having to lookup how to do simple actions.
 * @author Jonathan Protzenko
 */
 
 //this is a shortened version with only one func, see https://github.com/protz/thunderbird-stdlib for full version

var EXPORTED_SYMBOLS = [
	'msgHdrGetTags'
]

const { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

Cu.import("resource:///modules/mailServices.js");

/**
 * Given a msgHdr, return a list of tag objects. This function
 * just does the messy work of understanding how tags are
 * stored in nsIMsgDBHdrs.
 *
 * @param {nsIMsgDbHdr} aMsgHdr the msgHdr whose tags we want
 * @return {nsIMsgTag array} a list of tag objects
 */
function msgHdrGetTags (aMsgHdr) {
  let keywords = aMsgHdr.getStringProperty("keywords");
  let keywordList = keywords.split(' ');
  let keywordMap = {};
  for (let keyword of keywordList) {
    keywordMap[keyword] = true;
  }

  let tagArray = MailServices.tags.getAllTags({});
  let tags = tagArray.filter(tag => tag.key in keywordMap);
  return tags;
}
