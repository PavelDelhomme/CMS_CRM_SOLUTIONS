'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import blocksService, { BlockType } from '@/services/blocks.service'

export interface Block {
  id: string
  type: string
  data: Record<string, any>
  styles?: Record<string, any>
  children?: Block[]
}

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  availableBlockTypes?: BlockType[]
}

export default function BlockEditor({ blocks, onChange, availableBlockTypes }: BlockEditorProps) {
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadBlockTypes()
  }, [])

  const loadBlockTypes = async () => {
    try {
      const types = availableBlockTypes || await blocksService.getBlockTypes()
      setBlockTypes(types)
    } catch (error) {
      console.error('Error loading block types:', error)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)

      const newBlocks = arrayMove(blocks, oldIndex, newIndex)
      onChange(newBlocks)
    }
  }

  const addBlock = (blockType: BlockType) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType.name,
      data: {},
      styles: blockType.default_styles || {},
    }
    onChange([...blocks, newBlock])
  }

  const removeBlock = (blockId: string) => {
    onChange(blocks.filter(b => b.id !== blockId))
  }

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    onChange(
      blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Block Palette */}
      <div className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Blocs disponibles</h3>
        <div className="space-y-2">
          {blockTypes.map((blockType) => (
            <button
              key={blockType.id}
              onClick={() => addBlock(blockType)}
              className="w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-900 hover:border-blue-500 transition flex items-center gap-2"
            >
              <span className="text-xl">{blockType.icon || '📦'}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{blockType.label}</div>
                {blockType.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">{blockType.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {blocks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun bloc ajouté</p>
                  <p className="text-sm text-gray-400">
                    Cliquez sur un bloc dans la palette pour commencer
                  </p>
                </div>
              ) : (
                blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    blockTypes={blockTypes}
                    isSelected={selectedBlock === block.id}
                    onSelect={() => setSelectedBlock(block.id)}
                    onUpdate={(updates) => updateBlock(block.id, updates)}
                    onDelete={() => removeBlock(block.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Properties Panel */}
      {selectedBlock && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-300 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Propriétés du bloc</h3>
          <BlockPropertiesPanel
            block={blocks.find(b => b.id === selectedBlock)!}
            blockType={blockTypes.find(bt => bt.name === blocks.find(b => b.id === selectedBlock)!.type)}
            onUpdate={(updates) => updateBlock(selectedBlock, updates)}
          />
        </div>
      )}
    </div>
  )
}

// Sortable Block Component
function SortableBlock({
  block,
  blockTypes,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: {
  block: Block
  blockTypes: BlockType[]
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const blockType = blockTypes.find(bt => bt.name === block.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-4 bg-white dark:bg-gray-800 rounded-lg border-2 ${isSelected ? 'border-blue-500' : 'border-gray-200'} shadow-sm hover:shadow-md transition`}
    >
      {/* Block Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 cursor-move"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{blockType?.icon || '📦'}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{blockType?.label || block.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600"
            title="Sélectionner"
          >
            ⚙️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-4">
        <BlockRenderer block={block} blockType={blockType} onUpdate={onUpdate} />
      </div>
    </div>
  )
}

// Block Renderer Component
function BlockRenderer({
  block,
  blockType,
  onUpdate,
}: {
  block: Block
  blockType?: BlockType
  onUpdate: (updates: Partial<Block>) => void
}) {
  // Render based on block type
  switch (block.type) {
    case 'text':
      return (
        <textarea
          value={block.data.content || ''}
          onChange={(e) => onUpdate({ data: { ...block.data, content: e.target.value } })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Entrez votre texte..."
          rows={6}
        />
      )
    case 'heading':
      const headingLevel = block.data.level || 'h2'
      const HeadingTag = headingLevel as keyof JSX.IntrinsicElements
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={block.data.text || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, text: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded text-2xl font-bold focus:ring-2 focus:ring-blue-500"
            placeholder="Titre..."
          />
          <select
            value={headingLevel}
            onChange={(e) => onUpdate({ data: { ...block.data, level: e.target.value } })}
            className="text-sm p-1 border border-gray-300 rounded"
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
          </select>
        </div>
      )
    case 'image':
      return (
        <div className="space-y-2">
          <input
            type="url"
            value={block.data.src || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, src: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="URL de l'image..."
          />
          <input
            type="text"
            value={block.data.alt || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, alt: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Texte alternatif (alt)..."
          />
          {block.data.src && (
            <div className="mt-2">
              <img 
                src={block.data.src} 
                alt={block.data.alt || ''} 
                className="w-full max-h-64 object-contain rounded border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>
      )
    case 'button':
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={block.data.text || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, text: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Texte du bouton..."
          />
          <input
            type="url"
            value={block.data.url || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, url: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="URL du lien..."
          />
          <select
            value={block.data.style || 'primary'}
            onChange={(e) => onUpdate({ data: { ...block.data, style: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="primary">Primaire</option>
            <option value="secondary">Secondaire</option>
            <option value="outline">Outline</option>
          </select>
          <div className="mt-2">
            <button
              className={`px-4 py-2 rounded ${
                block.data.style === 'primary' ? 'bg-blue-600 text-white' :
                block.data.style === 'secondary' ? 'bg-gray-600 text-white' :
                'border-2 border-blue-600 text-blue-600'
              }`}
            >
              {block.data.text || 'Bouton'}
            </button>
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="space-y-2">
          <input
            type="url"
            value={block.data.url || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, url: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="URL de la vidéo (YouTube, Vimeo)..."
          />
          {block.data.url && (
            <div className="mt-2 aspect-video bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 flex items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Aperçu vidéo: {block.data.url}</p>
            </div>
          )}
        </div>
      )
    case 'spacer':
      return (
        <div className="space-y-2">
          <input
            type="number"
            value={block.data.height || 40}
            onChange={(e) => onUpdate({ data: { ...block.data, height: parseInt(e.target.value) || 40 } })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Hauteur en pixels..."
            min={10}
            max={200}
          />
          <div 
            className="bg-gray-200 border-2 border-dashed border-gray-300 rounded"
            style={{ height: `${block.data.height || 40}px` }}
          >
            <div className="h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              Espaceur: {(block.data.height || 40)}px
            </div>
          </div>
        </div>
      )
    case 'divider':
      return (
        <div className="space-y-2">
          <select
            value={block.data.style || 'solid'}
            onChange={(e) => onUpdate({ data: { ...block.data, style: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="solid">Solide</option>
            <option value="dashed">Tirets</option>
            <option value="dotted">Pointillés</option>
          </select>
          <div className={`border-t-2 ${
            block.data.style === 'solid' ? 'border-solid' :
            block.data.style === 'dashed' ? 'border-dashed' :
            'border-dotted'
          } border-gray-400`}></div>
        </div>
      )
    default:
      return (
        <div className="text-gray-500 dark:text-gray-400 text-sm space-y-2">
          <p>Bloc {block.type} - Configuration à venir</p>
          {blockType?.description && (
            <p className="text-xs text-gray-400">{blockType.description}</p>
          )}
        </div>
      )
  }
}

// Block Properties Panel
function BlockPropertiesPanel({
  block,
  blockType,
  onUpdate,
}: {
  block: Block
  blockType?: BlockType
  onUpdate: (updates: Partial<Block>) => void
}) {
  if (!blockType) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Type de bloc non trouvé</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
        <div className="text-sm text-gray-900 dark:text-gray-100">{blockType.label}</div>
      </div>

      {/* Render properties based on block schema */}
      {blockType.schema && Object.keys(blockType.schema).length > 0 && (
        <div className="space-y-3">
          {Object.entries(blockType.schema).map(([key, schema]: [string, any]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {schema.label || key}
              </label>
              {schema.type === 'text' && (
                <input
                  type="text"
                  value={block.data[key] || ''}
                  onChange={(e) =>
                    onUpdate({
                      data: { ...block.data, [key]: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              )}
              {schema.type === 'textarea' && (
                <textarea
                  value={block.data[key] || ''}
                  onChange={(e) =>
                    onUpdate({
                      data: { ...block.data, [key]: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  rows={3}
                />
              )}
              {schema.type === 'number' && (
                <input
                  type="number"
                  value={block.data[key] || ''}
                  onChange={(e) =>
                    onUpdate({
                      data: { ...block.data, [key]: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

