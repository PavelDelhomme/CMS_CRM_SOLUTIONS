'use client'

import React from 'react'

export interface Block {
  id: string
  type: string
  data: any
  styles?: any
  layout?: number
  position?: any
  container?: 'full' | 'none' | 'default' | string
  block_settings?: any
}

interface BlockRendererProps {
  block: Block
}

/**
 * Composant pour rendre un bloc dans l'affichage public
 * Version simplifiée de BlockPreviewRenderer pour l'affichage public
 */
export default function BlockRenderer({ block }: BlockRendererProps) {
  // Styles du wrapper
  const wrapperStyles: React.CSSProperties = {
    position: block.position?.type || block.styles?.position || 'static',
    top: block.position?.top || block.styles?.top,
    right: block.position?.right || block.styles?.right,
    bottom: block.position?.bottom || block.styles?.bottom,
    left: block.position?.left || block.styles?.left,
    zIndex: block.styles?.z_index || block.styles?.zIndex,
    overflow: block.styles?.overflow || 'visible',
    marginTop: block.styles?.margin_vertical || block.styles?.margin_top || block.styles?.marginTop,
    marginBottom: block.styles?.margin_vertical || block.styles?.margin_bottom || block.styles?.marginBottom,
    marginLeft: block.styles?.margin_horizontal || block.styles?.margin_left || block.styles?.marginLeft,
    marginRight: block.styles?.margin_horizontal || block.styles?.margin_right || block.styles?.marginRight,
  }

  // Styles du contenu
  const contentStyles: React.CSSProperties = {
    color: block.data.color || block.styles?.color,
    fontSize: block.styles?.font_size || block.styles?.fontSize,
    fontWeight: block.styles?.font_weight || block.styles?.fontWeight,
    textAlign: block.data.align || block.styles?.text_align || block.styles?.textAlign,
    backgroundColor: block.styles?.background_color || block.styles?.backgroundColor,
    padding: block.styles?.padding,
    borderRadius: block.styles?.border_radius || block.styles?.borderRadius,
  }

  // Container class - use block_settings if available, otherwise default
  const container = (block as any).container || block.block_settings?.container || 'default'
  const containerClass = container === 'full' ? 'w-full' :
    container === 'none' ? '' : 'max-w-7xl mx-auto'

  // Render based on block type
  switch (block.type) {
    case 'heading':
      const headingLevel = block.data.level || 'h2'
      const HeadingTag = headingLevel === 'h1' ? 'h1' :
                        headingLevel === 'h2' ? 'h2' :
                        headingLevel === 'h3' ? 'h3' :
                        headingLevel === 'h4' ? 'h4' : 'h2'
      return (
        <div style={wrapperStyles} className="mb-6">
          <div className={containerClass} style={{ textAlign: block.data.align || 'left' }}>
            {HeadingTag === 'h1' && (
              <h1 style={contentStyles} className="font-bold">
                {block.data.text || 'Titre'}
              </h1>
            )}
            {HeadingTag === 'h2' && (
              <h2 style={contentStyles} className="font-bold">
                {block.data.text || 'Titre'}
              </h2>
            )}
            {HeadingTag === 'h3' && (
              <h3 style={contentStyles} className="font-bold">
                {block.data.text || 'Titre'}
              </h3>
            )}
            {HeadingTag === 'h4' && (
              <h4 style={contentStyles} className="font-bold">
                {block.data.text || 'Titre'}
              </h4>
            )}
          </div>
        </div>
      )

    case 'text':
      return (
        <div style={wrapperStyles} className="mb-6">
          <div className={containerClass}>
            <div
              style={contentStyles}
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: block.data.content || block.data.text || '' }}
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div style={wrapperStyles} className="mb-6">
          <div className={containerClass} style={{ textAlign: block.data.align || 'center' }}>
            {block.data.url && (
              <img
                src={block.data.url}
                alt={block.data.alt || block.data.caption || ''}
                style={{
                  ...contentStyles,
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            )}
            {block.data.caption && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                {block.data.caption}
              </p>
            )}
          </div>
        </div>
      )

    case 'button':
      return (
        <div style={wrapperStyles} className="mb-6">
          <div className={containerClass} style={{ textAlign: block.data.align || 'left' }}>
            <a
              href={block.data.url || '#'}
              style={{
                ...contentStyles,
                display: 'inline-block',
                padding: block.styles?.padding || '0.75rem 1.5rem',
                background: block.data.background_color || block.styles?.background_color || '#2563eb',
                color: block.data.text_color || block.styles?.color || '#ffffff',
                borderRadius: block.styles?.border_radius || '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              {block.data.text || 'Bouton'}
            </a>
          </div>
        </div>
      )

    case 'hero':
      return (
        <div style={wrapperStyles} className="mb-6">
          <div
            className="w-full"
            style={{
              ...contentStyles,
              background: block.data.background_color || block.styles?.background_color || '#f3f4f6',
              padding: block.styles?.padding || '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <div className={containerClass}>
              <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                {block.data.title || 'Titre Hero'}
              </h1>
              {block.data.subtitle && (
                <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#6b7280' }}>
                  {block.data.subtitle}
                </p>
              )}
              {block.data.button_text && block.data.button_url && (
                <a
                  href={block.data.button_url}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  {block.data.button_text}
                </a>
              )}
            </div>
          </div>
        </div>
      )

    case 'columns':
      const columns = block.data.columns || []
      return (
        <div style={wrapperStyles} className="mb-6">
          <div className={containerClass}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: '1rem' }}>
              {columns.map((col: any, index: number) => (
                <div key={index} style={contentStyles}>
                  {col.content && (
                    <div dangerouslySetInnerHTML={{ __html: col.content }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'spacer':
      return (
        <div style={{ ...wrapperStyles, height: block.data.height || '2rem' }} />
      )

    case 'divider':
      return (
        <div style={wrapperStyles} className="mb-6">
          <div className={containerClass}>
            <hr style={{ ...contentStyles, border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />
          </div>
        </div>
      )

    default:
      // Fallback pour les blocs non reconnus
      return (
        <div style={wrapperStyles} className="mb-6">
          <div className={containerClass} style={contentStyles}>
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
              Bloc de type "{block.type}" non supporté
            </p>
          </div>
        </div>
      )
  }
}

