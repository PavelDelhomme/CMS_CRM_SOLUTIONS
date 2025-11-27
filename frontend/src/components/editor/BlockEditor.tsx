'use client'

import React, { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import blocksService, { BlockType } from '@/services/blocks.service'
import BlockPreview from './BlockPreview'

export interface Block {
  id: string
  type: string
  data: Record<string, any>
  styles?: Record<string, any>
  children?: Block[]
  layout?: 'full' | 'half' | 'third' | 'two-thirds' | 'quarter' | 'three-quarters'
  container?: 'container' | 'container-fluid' | 'none'
}


interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  availableBlockTypes?: BlockType[]
}

export default function BlockEditor({ blocks, onChange, availableBlockTypes }: BlockEditorProps) {
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [propertiesOpen, setPropertiesOpen] = useState(false)

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
      layout: 'full',
      container: 'container',
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
    <div className="flex h-full w-full flex-col relative">
      {/* Toolbar - Simplified */}
      <div className="flex items-center justify-between px-4 lg:px-6 xl:px-8 py-2.5 lg:py-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Mobile: Menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {blocks.length} bloc{blocks.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative w-full">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Block Palette with Categories - Modern Design */}
        <div className={`
          ${sidebarOpen ? 'fixed left-0 top-0 h-full z-50' : 'hidden'}
          lg:static lg:block
          w-64 lg:w-72 xl:w-80 2xl:w-96
          bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800
          border-r border-gray-200 dark:border-gray-700 
          p-4 sm:p-5 lg:p-6
          overflow-y-auto 
          transition-transform duration-300 ease-in-out
          shadow-lg lg:shadow-none
          flex-shrink-0
        `}>
          {/* Mobile: Close button */}
          <div className="flex items-center justify-between mb-5 lg:hidden pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Blocs disponibles</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h3 className="hidden lg:block text-base font-bold text-gray-900 dark:text-gray-100 mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">Blocs disponibles</h3>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Blocs disponibles</h3>
        
        {/* Group by category */}
        {['content', 'layout', 'media', 'custom'].map((category) => {
          const categoryBlocks = blockTypes.filter((bt: BlockType) => bt.category === category)
          if (categoryBlocks.length === 0) return null
          
          const categoryLabels: { [key: string]: string } = {
            content: 'Contenu',
            layout: 'Mise en page',
            media: 'Médias',
            custom: 'Personnalisé'
          }
          
          return (
            <div key={category} className="mb-6">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md inline-block">
                {categoryLabels[category] || category}
              </h4>
              <div className="space-y-2.5">
                {categoryBlocks.map((blockType: BlockType) => (
                  <button
                    key={blockType.id}
                    onClick={() => {
                      addBlock(blockType)
                      setSidebarOpen(false) // Close sidebar on mobile after adding
                    }}
                    className="w-full px-3 sm:px-4 py-3 text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md transition-all duration-200 flex items-center gap-3 group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-600 group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-900/30 dark:group-hover:to-blue-800/30 transition-all">
                      <span className="text-xl sm:text-2xl">{blockType.icon || '📦'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{blockType.label}</div>
                      {blockType.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 hidden sm:block mt-0.5">{blockType.description}</div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        
        {/* Fallback if no categories */}
        {blockTypes.length > 0 && !blockTypes.some(bt => bt.category) && (
          <div className="space-y-2">
            {blockTypes.map((blockType: BlockType) => (
              <button
                key={blockType.id}
                onClick={() => addBlock(blockType)}
                className="w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-blue-500 transition flex items-center gap-2"
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
        )}
      </div>

        {/* Main Editor Area - Split View Permanent - Full Width */}
        <div className="flex-1 flex flex-row min-w-0 w-full h-full">
          {/* Editor Panel - Left Side */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-700 h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 max-w-full">
                  {blocks.length === 0 ? (
                    <div className="text-center py-12 lg:py-20">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2 text-lg font-semibold">Aucun bloc ajouté</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cliquez sur un bloc dans la palette à gauche pour commencer
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                          La prévisualisation s'affichera à droite →
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4 lg:gap-6">
                      {blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          blockTypes={blockTypes}
                          isSelected={selectedBlock === block.id}
                          onSelect={() => setSelectedBlock(block.id)}
                          onUpdate={(updates) => updateBlock(block.id, updates)}
                          onDelete={() => removeBlock(block.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Preview Panel - Right Side - Always Visible */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            <BlockPreview
              blocks={blocks}
              blockTypes={blockTypes}
              onBlocksChange={onChange}
              onBlockSelect={(id) => {
                setSelectedBlock(id)
                if (id && window.innerWidth >= 1024) setPropertiesOpen(true)
              }}
              selectedBlockId={selectedBlock}
              isInteractive={true}
            />
          </div>
        </div>

        {/* Properties Panel - Responsive (Drawer on mobile, sidebar on desktop) */}
        {selectedBlock && (
          <>
            {/* Mobile Overlay */}
            {propertiesOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => {
                  setPropertiesOpen(false)
                  setSelectedBlock(null)
                }}
              />
            )}

            {/* Properties Panel - Wider on desktop */}
            <div className={`
              ${propertiesOpen ? 'fixed right-0 top-0 h-full z-50' : 'hidden'}
              lg:static lg:block
              w-full sm:w-80 lg:w-96 xl:w-[28rem] 2xl:w-[32rem]
              bg-white dark:bg-gray-800 
              border-l border-gray-300 dark:border-gray-700 
              p-4 sm:p-5 lg:p-6 xl:p-8
              overflow-y-auto
              shadow-lg lg:shadow-none
              transition-transform duration-300 ease-in-out
              flex-shrink-0
            `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Propriétés du bloc</h3>
                <button
                  onClick={() => {
                    setSelectedBlock(null)
                    setPropertiesOpen(false)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <BlockPropertiesPanel
                block={blocks.find(b => b.id === selectedBlock)!}
                blockType={blockTypes.find(bt => bt.name === blocks.find(b => b.id === selectedBlock)!.type)}
                onUpdate={(updates) => updateBlock(selectedBlock, updates)}
              />
            </div>
          </>
        )}

        {/* Mobile: Floating action button to open properties */}
        {selectedBlock && !propertiesOpen && (
          <button
            onClick={() => setPropertiesOpen(true)}
            className="lg:hidden fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
            aria-label="Ouvrir les propriétés"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        )}
      </div>
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

  // Calculate width based on layout
  const layoutWidth = block.layout === 'full' ? 'w-full' :
    block.layout === 'three-quarters' ? 'w-3/4' :
    block.layout === 'two-thirds' ? 'w-2/3' :
    block.layout === 'half' ? 'w-1/2' :
    block.layout === 'third' ? 'w-1/3' :
    block.layout === 'quarter' ? 'w-1/4' : 'w-full'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${layoutWidth} mb-4 bg-white dark:bg-gray-800 rounded-xl border-2 ${isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700'} shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden`}
    >
      {/* Block Header - Modern Design */}
      <div
        className={`flex items-center justify-between p-3 sm:p-4 cursor-move transition-colors ${
          isSelected 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-b border-blue-200 dark:border-blue-700' 
            : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-800'
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-lg sm:text-xl">{blockType?.icon || '📦'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate block">{blockType?.label || block.type}</span>
            {blockType?.description && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate block hidden sm:block">{blockType.description}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`p-2 rounded-lg transition-all ${
              isSelected 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            title="Sélectionner"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
            title="Supprimer"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Block Content - Modern Design */}
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
        {/* Layout Controls - Enhanced */}
        <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Largeur:</span>
              <select
                value={block.layout || 'full'}
                onChange={(e) => onUpdate({ layout: e.target.value as Block['layout'] })}
                className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="full">100%</option>
                <option value="three-quarters">75%</option>
                <option value="two-thirds">66%</option>
                <option value="half">50%</option>
                <option value="third">33%</option>
                <option value="quarter">25%</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Conteneur:</span>
              <select
                value={block.container || 'container'}
                onChange={(e) => onUpdate({ container: e.target.value as Block['container'] })}
                className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="container">Conteneur</option>
                <option value="container-fluid">Fluide</option>
                <option value="none">Aucun</option>
              </select>
            </div>
          </div>
        </div>
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
          className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Entrez votre texte..."
          rows={4}
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
            className="w-full p-2 sm:p-3 border border-gray-300 rounded text-lg sm:text-2xl font-bold focus:ring-2 focus:ring-blue-500"
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
          {!block.data.src && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Voir la prévisualisation à droite →</p>
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
          {(!block.data.text || !block.data.url) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Voir la prévisualisation à droite →</p>
          )}
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
          {!block.data.url && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Voir la prévisualisation à droite →</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Espaceur de {(block.data.height || 40)}px - Voir la prévisualisation à droite →</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Séparateur {block.data.style || 'solid'} - Voir la prévisualisation à droite →</p>
        </div>
      )
    default:
      return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bloc {block.type}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Configuration à venir</p>
              {blockType?.description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{blockType.description}</p>
              )}
            </div>
          </div>
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

