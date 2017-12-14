# Bling

Markdown -> HTML -> PDF conversion, with live preview.

Markdown to HTML conversion with Showdown JS, HTML to PDF conversion with browser.


## Status

Proof of concept. The following kind of works:

- Conversion from markdown to html
- Loading markdown from local file to editor
- Loading Bling Style from local file (arbitrary JS, `form-green.js` example
  sets showdown extension and loads custom CSS)
- Saving edited markdown
- Printing PDF
- Rudimentary pager
    - page breaks between top level elements, only 
    - does not break page after headings


## Requirements

Files in this repository. Browser, tested (and probably works only on) Chromium
61 on Ubuntu Linux.


## Usage

Open `index.html`, select `Load Markdown` from `File` menu, navigate to
`styles/form-green/form-green.md` example, and open it. Select `Load Style` from
`File` menu, navigate to `styles/form-green/form-green.js`, and open it. Select
`Print PDF` from `File` menu. Enjoy.


## Additional markdown

- Three or more equal signs `===` at the beginning of a line surrounded by empty
  lines inserts a page break
- Metadata is extracted from blocks

        ---
        date: 2017-11-29
        style: ./styles/slides-csc-2015/slides-csc-2015.js
        paper: Projector 1920:1080
        ---
    
  and the values are available for style JS scripts in `bling.metadata['key']`, and as a
  macro BLINGMETADATA[key] in the markdown.
  
  When markdown file is loaded, the style (path to style JS file relative to editor
  "app" page `index.html`) in the field `style` is loaded, and the paper size in
  the field `paper` is set.


## Writing new styles

- Use `rem` units for font sizes, and ALL (border, margin, padding, etc) lengths
  in CSS. That should match the font-sizes in both screen (scalable) and on PDF.
  One `rem` unit corresponds to 12pt on print.
- the following CSS variables are available for custom styles
    - `width` -- page width, including margins
    - `height` -- page height, including margins
    - `fontsize` -- base `rem` font size
    - `textwidth` -- page width without margins (drawable area)
    - `textheight` -- page height without margins (drawable area)

## TODO

- Add snowdown KaTeX plugin (at least for slides)!
- lot's of cleaning, of course...
- rewrite...
- headers and footers
- page numbering
- plus all stuff in the source TODO comments...


## Known limitations

- Saves to Download folder, only. Yeah, you can change the Download folder,
  but...
- performance not optimized
