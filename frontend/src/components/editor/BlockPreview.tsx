'use client'

import React, { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Block } from './BlockEditor'
import blocksService, { BlockType } from '@/services/blocks.service'

interface BlockPreviewProps {
  blocks: Block[]
  blockTypes: BlockType[]
  onBlocksChange?: (blocks: Block[]) => void
  onBlockSelect?: (blockId: string | null) => void
  selectedBlockId?: string | null
  isInteractive?: boolean
}

export default function BlockPreview({ 
  blocks, 
  blockTypes, 
  onBlocksChange,
  onBlockSelect,
  selectedBlockId,
  isInteractive = false 
}: BlockPreviewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsDragging(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setIsDragging(false)
    setActiveId(null)

    if (over && active.id !== over.id && onBlocksChange) {
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex)
        onBlocksChange(newBlocks)
      }
    }
  }

  const handleBlockClick = (blockId: string) => {
    if (onBlockSelect && !isDragging) {
      onBlockSelect(blockId === selectedBlockId ? null : blockId)
    }
  }

  const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 overflow-y-auto flex flex-col">
      {/* Preview Header - Simulated Browser Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 rounded px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
          localhost:9494/
        </div>
        {isInteractive && (
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
            Mode prévisualisation interactive
          </div>
        )}
      </div>

      {/* Preview Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto w-full">
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-full">
            {blocks.length === 0 ? (
              <div className="text-center py-20 lg:py-32">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">Aucun contenu à prévisualiser</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Ajoutez des blocs dans l'éditeur à gauche pour voir la prévisualisation ici
                  </p>
                </div>
              </div>
            ) : (
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => (
                  <SortablePreviewBlock
                    key={block.id}
                    block={block}
                    blockType={blockTypes.find(bt => bt.name === block.type)}
                    isSelected={selectedBlockId === block.id}
                    isInteractive={isInteractive}
                    onClick={() => handleBlockClick(block.id)}
                  />
                ))}
              </SortableContext>
            )}
          </div>
        </div>
        <DragOverlay>
          {activeBlock ? (
            <div className="opacity-50">
              <BlockPreviewRenderer
                block={activeBlock}
                blockType={blockTypes.find(bt => bt.name === activeBlock.type)}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// Sortable Preview Block Component
function SortablePreviewBlock({
  block,
  blockType,
  isSelected,
  isInteractive,
  onClick,
}: {
  block: Block
  blockType?: BlockType
  isSelected: boolean
  isInteractive: boolean
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: !isInteractive })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-6 relative group ${isInteractive ? 'cursor-move' : ''} ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      onClick={onClick}
      {...(isInteractive ? { ...attributes, ...listeners } : {})}
    >
      {isInteractive && (
        <div className="absolute -top-2 -left-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="mr-1">⋮⋮</span>
          Déplacer
        </div>
      )}
      <BlockPreviewRenderer block={block} blockType={blockType} />
    </div>
  )
}

function BlockPreviewRenderer({ block, blockType }: { block: Block; blockType?: BlockType }) {
  // Apply block styles if any
  const blockStyles: React.CSSProperties = {
    ...(block.styles || {}),
  }

  // Get layout width
  const layoutWidth = block.layout === 'full' ? 'w-full' :
    block.layout === 'three-quarters' ? 'w-3/4' :
    block.layout === 'two-thirds' ? 'w-2/3' :
    block.layout === 'half' ? 'w-1/2' :
    block.layout === 'third' ? 'w-1/3' :
    block.layout === 'quarter' ? 'w-1/4' : 'w-full'

  // Get container class
  const containerClass = block.container === 'container-fluid' ? 'w-full' :
    block.container === 'none' ? '' : 'max-w-7xl mx-auto'

  const content = (() => {
    switch (block.type) {
    case 'heading':
      const HeadingTag = (block.data.level || 'h2') as keyof JSX.IntrinsicElements
      return (
        <div style={blockStyles} className="mb-6">
          <HeadingTag className="font-bold" style={{ 
            fontSize: block.styles?.font_size || '2rem',
            fontWeight: block.styles?.font_weight || 'bold',
            marginBottom: block.styles?.margin_bottom || '1rem',
            textAlign: block.data.align || 'left'
          }}>
            {block.data.text || 'Titre'}
          </HeadingTag>
        </div>
      )

    case 'text':
      return (
        <div style={blockStyles} className="mb-6 prose dark:prose-invert max-w-none">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: (block.data.content || '').replace(/\n/g, '<br />') 
            }}
            style={{
              fontSize: block.styles?.font_size || '1rem',
              lineHeight: block.styles?.line_height || '1.6',
            }}
          />
        </div>
      )

    case 'image':
      if (!block.data.src) {
        return (
          <div className="mb-6 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded text-center text-gray-400">
            Image non configurée
          </div>
        )
      }
      return (
        <div style={{ ...blockStyles, textAlign: block.data.align || 'center' }} className="mb-6">
          <img
            src={block.data.src}
            alt={block.data.alt || ''}
            className="max-w-full h-auto rounded-lg shadow-md"
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage non disponible%3C/text%3E%3C/svg%3E'
            }}
          />
          {block.data.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-2 text-center">
              {block.data.caption}
            </p>
          )}
        </div>
      )

    case 'button':
      const buttonStyleClass = block.data.style === 'primary' 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : block.data.style === 'secondary'
        ? 'bg-gray-600 hover:bg-gray-700 text-white'
        : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900'
      
      return (
        <div style={{ ...blockStyles, textAlign: block.data.align || 'left' }} className="mb-6">
          <a
            href={block.data.url || '#'}
            className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${buttonStyleClass}`}
            style={{
              padding: block.styles?.padding || '0.75rem 1.5rem',
              borderRadius: block.styles?.border_radius || '0.5rem',
            }}
          >
            {block.data.text || 'Bouton'}
          </a>
        </div>
      )

    case 'video':
      if (!block.data.url) {
        return (
          <div className="mb-6 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded text-center text-gray-400">
            Vidéo non configurée
          </div>
        )
      }
      return (
        <div style={blockStyles} className="mb-6">
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <iframe
              src={block.data.url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )

    case 'spacer':
      return (
        <div 
          style={{ 
            ...blockStyles,
            height: `${block.data.height || 40}px`,
            display: 'block'
          }} 
          className="mb-6"
        />
      )

    case 'divider':
      const dividerStyle = block.data.style === 'solid' ? 'solid' : block.data.style === 'dashed' ? 'dashed' : 'dotted'
      const dividerWidth = block.data.width === 'full' ? '100%' : block.data.width === 'half' ? '50%' : '33%'
      return (
        <div style={blockStyles} className="mb-6 flex justify-center">
          <div 
            className={`border-t-2 border-gray-400 dark:border-gray-600`}
            style={{ 
              borderStyle: dividerStyle,
              width: dividerWidth,
              margin: block.styles?.margin || '2rem 0'
            }}
          />
        </div>
      )

    case 'columns':
      const columnCount = block.data.columns_count || 2
      return (
        <div 
          style={{
            ...blockStyles,
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            gap: block.styles?.gap || '1rem',
          }}
          className="mb-6 grid gap-4"
        >
          {Array.from({ length: columnCount }).map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
              {block.data[`column_${i + 1}_content`] || `Colonne ${i + 1}`}
            </div>
          ))}
        </div>
      )

    case 'gallery':
      const images = block.data.images || []
      const galleryColumns = block.data.columns || 3
      return (
        <div style={blockStyles} className="mb-6">
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${galleryColumns}, 1fr)`,
            }}
          >
            {images.length > 0 ? (
              images.map((img: string, i: number) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={img}
                    alt={`Image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded">
                Aucune image dans la galerie
              </div>
            )}
          </div>
        </div>
      )

    case 'testimonials':
      const testimonials = block.data.testimonials || []
      return (
        <div style={blockStyles} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.length > 0 ? (
              testimonials.map((testimonial: any, i: number) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-4">
                    {testimonial.avatar && (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {testimonial.name || 'Client'}
                      </div>
                      {testimonial.role && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.role}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "{testimonial.text || 'Témoignage...'}"
                  </p>
                  {testimonial.rating && (
                    <div className="mt-3 text-yellow-500">
                      {'★'.repeat(testimonial.rating)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded">
                Aucun témoignage
              </div>
            )}
          </div>
        </div>
      )

    case 'form':
      return (
        <div style={blockStyles} className="mb-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4">{block.data.title || 'Formulaire de contact'}</h3>
          <form className="space-y-4">
            {block.data.fields?.map((field: any, i: number) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label || 'Champ'}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder={field.placeholder}
                    disabled
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={field.placeholder}
                    disabled
                  />
                )}
              </div>
            )) || (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} disabled />
                </div>
              </>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              disabled
            >
              {block.data.submit_text || 'Envoyer'}
            </button>
          </form>
        </div>
      )

    case 'pricing':
      const plans = block.data.plans || []
      return (
        <div style={blockStyles} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.length > 0 ? (
              plans.map((plan: any, i: number) => (
                <div
                  key={i}
                  className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
                    plan.featured ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.featured && (
                    <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                      Populaire
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {plan.name || 'Plan'}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {plan.price || '0'}€
                    </span>
                    {plan.period && (
                      <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features?.map((feature: string, j: number) => (
                      <li key={j} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      plan.featured
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    disabled
                  >
                    {plan.button_text || 'Choisir'}
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded">
                Aucun plan de tarification
              </div>
            )}
          </div>
        </div>
      )

    case 'accordion':
      const items = block.data.items || []
      return (
        <div style={blockStyles} className="mb-6">
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map((item: any, i: number) => (
                <details
                  key={i}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {item.title || `Élément ${i + 1}`}
                  </summary>
                  <div className="p-4 pt-0 text-gray-700 dark:text-gray-300">
                    {item.content || 'Contenu...'}
                  </div>
                </details>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded">
                Aucun élément d'accordéon
              </div>
            )}
          </div>
        </div>
      )

    case 'tabs':
      const tabs = block.data.tabs || []
      return (
        <div style={blockStyles} className="mb-6">
          {tabs.length > 0 ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {tabs.map((tab: any, i: number) => (
                  <button
                    key={i}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      i === 0
                        ? 'bg-white dark:bg-gray-900 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    disabled
                  >
                    {tab.title || `Onglet ${i + 1}`}
                  </button>
                ))}
              </div>
              <div className="p-4 bg-white dark:bg-gray-900">
                {tabs[0]?.content || 'Contenu de l\'onglet...'}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded">
              Aucun onglet
            </div>
          )}
        </div>
      )

    case 'hero':
      return (
        <div 
          style={{
            ...blockStyles,
            backgroundImage: block.data.background_image ? `url(${block.data.background_image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: block.styles?.padding || '4rem 2rem',
            textAlign: block.styles?.text_align || 'center',
            minHeight: '400px',
          }}
          className="mb-6 relative rounded-lg overflow-hidden"
        >
          {block.data.overlay && (
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          )}
          <div className="relative z-10 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{block.data.title || 'Titre Hero'}</h1>
            {block.data.subtitle && (
              <p className="text-xl mb-6">{block.data.subtitle}</p>
            )}
            {block.data.button_text && block.data.button_url && (
              <a
                href={block.data.button_url}
                className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                {block.data.button_text}
              </a>
            )}
          </div>
        </div>
      )

    default:
      return (
        <div style={blockStyles} className="mb-6 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bloc {block.type}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Prévisualisation non disponible</p>
            </div>
          </div>
        </div>
      )
    }
  })()

  // Wrap content with layout and container
  return (
    <div className={`${containerClass} mb-6`}>
      <div className={layoutWidth}>
        {content}
      </div>
    </div>
  )
}

