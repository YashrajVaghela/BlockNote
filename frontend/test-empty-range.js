const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent('<div id="editor" contenteditable="true"></div>');
  await page.evaluate(() => {
    const el = document.getElementById('editor');
    el.focus();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        console.log('SUCCESS, offset:', preCaretRange.toString().length);
      } catch(e) {
        console.log('ERROR:', e.message);
      }
    }
  });

  await browser.close();
})();
