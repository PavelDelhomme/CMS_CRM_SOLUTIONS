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
      <div className="w-64 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Blocs disponibles</h3>
        <div className="space-y-2">
          {blockTypes.map((blockType) => (
            <button
              key={blockType.id}
              onClick={() => addBlock(blockType)}
              className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition flex items-center gap-2"
            >
              <span className="text-xl">{blockType.icon || '📦'}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{blockType.label}</div>
                {blockType.description && (
                  <div className="text-xs text-gray-500">{blockType.description}</div>
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
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              {blocks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Aucun bloc ajouté</p>
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
        <div className="w-80 bg-white border-l border-gray-300 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Propriétés du bloc</h3>
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
      className={`mb-4 bg-white rounded-lg border-2 ${isSelected ? 'border-blue-500' : 'border-gray-200'} shadow-sm hover:shadow-md transition`}
    >
      {/* Block Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-move"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{blockType?.icon || '📦'}</span>
          <span className="text-sm font-medium text-gray-700">{blockType?.label || block.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="p-1 text-gray-500 hover:text-blue-600"
            title="Sélectionner"
          >
            ⚙️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-500 hover:text-red-600"
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
  // Simple block rendering - can be extended
  switch (block.type) {
    case 'text':
      return (
        <textarea
          value={block.data.content || ''}
          onChange={(e) => onUpdate({ data: { ...block.data, content: e.target.value } })}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Entrez votre texte..."
          rows={4}
        />
      )
    case 'heading':
      return (
        <input
          type="text"
          value={block.data.text || ''}
          onChange={(e) => onUpdate({ data: { ...block.data, text: e.target.value } })}
          className="w-full p-2 border border-gray-300 rounded text-2xl font-bold"
          placeholder="Titre..."
        />
      )
    case 'image':
      return (
        <div>
          <input
            type="url"
            value={block.data.src || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, src: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded mb-2"
            placeholder="URL de l'image..."
          />
          {block.data.src && (
            <img src={block.data.src} alt={block.data.alt || ''} className="w-full rounded" />
          )}
        </div>
      )
    default:
      return (
        <div className="text-gray-500 text-sm">
          Bloc {block.type} - Configuration à venir
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
    return <div className="text-sm text-gray-500">Type de bloc non trouvé</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
        <div className="text-sm text-gray-900">{blockType.label}</div>
      </div>

      {/* Render properties based on block schema */}
      {blockType.schema && Object.keys(blockType.schema).length > 0 && (
        <div className="space-y-3">
          {Object.entries(blockType.schema).map(([key, schema]: [string, any]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
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

