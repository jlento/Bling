# Bling

Markdown -> HTML -> PDF conversion, with live preview.

Markdown to HTML conversion with Showdown JS, HTML to PDF conversion with browser.

## Status

Proof of concept. The following kind of works:

- Conversion from markdown to html
- Loading markdown from local file to editor
- Loading Bling Style (arbitrary JS, currently set snow) from local file
- Saving edited markdown
- Printing PDF
- Changing style, i.e. CSS and snowdown extension, works. Rudimentary pager works.

## Requirements

Files in this repository. Browser, tested (and probably works only on) Chromium
61 on Ubuntu Linux.

## Usage

Open `index.html`, select `Load Markdown` from `File` menu, navigate to
`styles/form-green/form-green.md` example, and open it. Select `Load Style` from
`File` menu, navigate to `styles/form-green/form-green.js`, and open it. Select
`Print PDF` from `File` menu. Enjoy.

## Additional markdown

## TODO

- lot's of cleaning, of course...
- Three or more equal signs `===` inserts a page break
- plus all stuff in the source TODO comments...

## Known limitations

- Saves to Download folder, only. Yeah, you can change the Download folder,
  but...
- performance not optimized
