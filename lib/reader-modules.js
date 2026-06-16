/**
 * Reader-only modules — lazy-loaded when a document opens (not on landing boot).
 */

/** @typedef {{
 *   parseDocument: typeof import('./parse-document.js').parseDocument,
 *   peekDocumentTitle: typeof import('./parse-document.js').peekDocumentTitle,
 *   renderDocument: typeof import('./render-document.js').renderDocument,
 *   renderToc: typeof import('./render-document.js').renderToc,
 *   fitPosterTitles: typeof import('./fit-poster-title.js').fitPosterTitles,
 *   enhanceCodeBlocks: typeof import('./code-blocks.js').enhanceCodeBlocks,
 *   copyCodeFromButton: typeof import('./code-blocks.js').copyCodeFromButton,
 *   enhancePosterImageHalftone: typeof import('./image-halftone.js').enhancePosterImageHalftone,
 *   applyImageTableLayouts: typeof import('./image-table-layout.js').applyImageTableLayouts,
 *   setupImageLightbox: typeof import('./image-lightbox.js').setupImageLightbox,
 *   exportPosterAsPdf: typeof import('./poster-export.js').exportPosterAsPdf,
 *   mountEdgeHalftone: typeof import('./edge-halftone.js').mountEdgeHalftone
 * }} ReaderModules */

/** @returns {Promise<ReaderModules>} */
export async function loadReaderModules() {
  const [
    parseDocumentModule,
    renderDocumentModule,
    fitPosterTitleModule,
    codeBlocksModule,
    imageHalftoneModule,
    imageTableModule,
    imageLightboxModule,
    posterExportModule,
    edgeHalftoneModule
  ] = await Promise.all([
    import('./parse-document.js'),
    import('./render-document.js'),
    import('./fit-poster-title.js'),
    import('./code-blocks.js'),
    import('./image-halftone.js'),
    import('./image-table-layout.js'),
    import('./image-lightbox.js'),
    import('./poster-export.js'),
    import('./edge-halftone.js')
  ]);

  return {
    parseDocument: parseDocumentModule.parseDocument,
    peekDocumentTitle: parseDocumentModule.peekDocumentTitle,
    renderDocument: renderDocumentModule.renderDocument,
    renderToc: renderDocumentModule.renderToc,
    fitPosterTitles: fitPosterTitleModule.fitPosterTitles,
    enhanceCodeBlocks: codeBlocksModule.enhanceCodeBlocks,
    copyCodeFromButton: codeBlocksModule.copyCodeFromButton,
    enhancePosterImageHalftone: imageHalftoneModule.enhancePosterImageHalftone,
    applyImageTableLayouts: imageTableModule.applyImageTableLayouts,
    setupImageLightbox: imageLightboxModule.setupImageLightbox,
    exportPosterAsPdf: posterExportModule.exportPosterAsPdf,
    mountEdgeHalftone: edgeHalftoneModule.mountEdgeHalftone
  };
}
