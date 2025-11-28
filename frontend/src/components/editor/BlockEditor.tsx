'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import blocksService, { BlockType } from '@/services/blocks.service'
import { useFeatures } from '@/contexts/FeaturesContext'
import UrlInputWithSuggestions from './UrlInputWithSuggestions'
import { useHistory } from '@/hooks/useHistory'
import { useBlockTracking } from '@/hooks/useBlockTracking'

export interface Block {
  id: string
  type: string
  data: Record<string, any>
  styles?: Record<string, any>
  children?: Block[]
  layout?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 // Nombre de colonnes sur 12 (système Bootstrap)
  container?: 'container' | 'container-fluid' | 'none'
  position?: {
    type: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
    top?: string
    right?: string
    bottom?: string
    left?: string
    align?: 'left' | 'center' | 'right' | 'stretch'
    alignTo?: string // ID du bloc de référence pour position relative
  }
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
  const [propertiesTab, setPropertiesTab] = useState<'content' | 'style'>('content')
  const { canUseBlockType } = useFeatures()
  
  // Historique avec undo/redo
  const history = useHistory<Block[]>(blocks, 50)
  const isHistoryUpdate = useRef(false)
  
  // Tracking des blocs
  const { trackBlockAction } = useBlockTracking()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Synchroniser l'historique avec les blocks externes
  useEffect(() => {
    if (!isHistoryUpdate.current) {
      history.reset(blocks)
    }
    isHistoryUpdate.current = false
  }, [blocks])

  // Synchroniser onChange avec l'historique
  useEffect(() => {
    if (history.state !== blocks) {
      onChange(history.state)
    }
  }, [history.state])

  useEffect(() => {
    loadBlockTypes()
  }, [])

  // Raccourcis clavier pour undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z ou Cmd+Z pour undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (history.canUndo) {
          isHistoryUpdate.current = true
          history.undo()
        }
      }
      // Ctrl+Shift+Z ou Cmd+Shift+Z pour redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (history.canRedo) {
          isHistoryUpdate.current = true
          history.redo()
        }
      }
      // Ctrl+Y pour redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        if (history.canRedo) {
          isHistoryUpdate.current = true
          history.redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history])

  const loadBlockTypes = async () => {
    try {
      const types = availableBlockTypes || await blocksService.getBlockTypes()
      // Ne pas filtrer ici - on affiche tous les blocs mais on les désactive selon les features
      // Cela permet de voir ce qui est disponible avec un upgrade
      setBlockTypes(types)
    } catch (error) {
      console.error('Error loading block types:', error)
    }
  }

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = history.state.findIndex((b: Block) => b.id === active.id)
      const newIndex = history.state.findIndex((b: Block) => b.id === over.id)

      const newBlocks = arrayMove(history.state, oldIndex, newIndex)
      history.set(newBlocks, true)
    }
  }, [history])

  const addBlock = useCallback((blockType: BlockType) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType.name,
      data: {},
      styles: blockType.default_styles || {},
      layout: 12, // Par défaut, pleine largeur (12/12)
      container: 'container',
    }
    history.set([...history.state, newBlock], true)
    setSelectedBlock(newBlock.id)
    setPropertiesOpen(true)
    // Tracker l'ajout du bloc
    trackBlockAction(blockType.name, 'add')
  }, [history, trackBlockAction])

  const removeBlock = useCallback((blockId: string) => {
    // Désélectionner immédiatement le bloc si c'était celui sélectionné (optimistic UI)
    if (selectedBlock === blockId) {
      setSelectedBlock(null)
      setPropertiesOpen(false)
    }
    
    // Trouver le bloc à supprimer pour le tracking
    const blockToDelete = history.state.find((b: Block) => b.id === blockId)
    
    // Suppression immédiate dans l'historique (pas de délai)
    const newBlocks = history.state.filter((b: Block) => b.id !== blockId)
    history.set(newBlocks, true)
    
    // Tracker la suppression de manière asynchrone pour ne pas bloquer l'UI
    if (blockToDelete) {
      // Utiliser requestIdleCallback ou setTimeout pour ne pas bloquer
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          trackBlockAction(blockToDelete.type, 'delete')
        })
      } else {
        setTimeout(() => {
          trackBlockAction(blockToDelete.type, 'delete')
        }, 0)
      }
    }
  }, [history, selectedBlock, trackBlockAction])

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    const block = history.state.find((b: Block) => b.id === blockId)
    const newBlocks = history.state.map((b: Block) =>
      b.id === blockId ? { ...b, ...updates } : b
    )
    
    // Si on a fait undo avant (futur non vide), créer une nouvelle branche
    // Le hook useHistory gère déjà cela en effaçant le futur et créant une nouvelle branche
    history.set(newBlocks, true)
    
    // Tracker la modification du bloc (debounce implicite via historique)
    if (block) {
      trackBlockAction(block.type, 'update')
    }
  }, [history, trackBlockAction])

  const handleUndo = useCallback(() => {
    isHistoryUpdate.current = true
    history.undo()
    // Fermer les paramètres quand on fait undo
    setPropertiesOpen(false)
    setSelectedBlock(null)
  }, [history])

  const handleRedo = useCallback(() => {
    isHistoryUpdate.current = true
    history.redo()
    // Fermer les paramètres quand on fait redo
    setPropertiesOpen(false)
    setSelectedBlock(null)
  }, [history])

  // Gérer l'ouverture des paramètres - fermer la sidebar des blocs
  const handleSelectBlock = useCallback((blockId: string) => {
    setSelectedBlock(blockId)
    setPropertiesOpen(true)
    setSidebarOpen(false) // Fermer la sidebar des blocs
  }, [])

  // Gérer la fermeture des paramètres
  const handleCloseProperties = useCallback(() => {
    setPropertiesOpen(false)
    setSelectedBlock(null)
  }, [])


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
                {categoryBlocks.map((blockType: BlockType) => {
                  const isPremium = blockType.requires_premium
                  const canUse = canUseBlockType(blockType.name, isPremium)
                  
                  return (
                    <button
                      key={blockType.id}
                      onClick={() => {
                        if (canUse) {
                          addBlock(blockType)
                          setSidebarOpen(false)
                        }
                      }}
                      disabled={!canUse}
                      className={`w-full px-3 sm:px-4 py-3 text-left bg-white dark:bg-gray-800 border-2 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        canUse
                          ? 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md cursor-pointer group'
                          : 'border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                      }`}
                      title={!canUse && isPremium ? 'Bloc premium - Nécessite un abonnement supérieur' : ''}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br flex items-center justify-center border transition-all ${
                        canUse
                          ? 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-gray-200 dark:border-gray-600 group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-900/30 dark:group-hover:to-blue-800/30'
                          : 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-100 dark:border-gray-700'
                      }`}>
                        <span className="text-xl sm:text-2xl">{blockType.icon || '📦'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`text-sm sm:text-base font-semibold truncate transition-colors ${
                            canUse ? 'text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {blockType.label}
                          </div>
                          {isPremium && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex-shrink-0">
                              ⭐ Premium
                            </span>
                          )}
                        </div>
                        {blockType.description && (
                          <div className={`text-xs line-clamp-1 hidden sm:block mt-0.5 ${
                            canUse ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {blockType.description}
                          </div>
                        )}
                        {!canUse && isPremium && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 hidden sm:block">
                            Nécessite un abonnement premium
                          </div>
                        )}
                      </div>
                      {canUse ? (
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {/* Fallback if no categories */}
        {blockTypes.length > 0 && !blockTypes.some((bt: BlockType) => bt.category) && (
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

        {/* Main Editor Area - Full Width - No Preview */}
        <div className="flex-1 flex flex-col min-w-0 w-full h-full">
          {/* Editor Panel - Full Width */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={history.state.map((b: Block) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 max-w-full">
                  {history.state.length === 0 ? (
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
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-12 gap-4 lg:gap-6 auto-rows-min">
                      {history.state
                        .filter((b: Block) => !b.position || b.position.type === 'static')
                        .map((block) => {
                          // Calculer le span de colonnes basé sur le layout (système 12 colonnes)
                          const layoutCols = block.layout || 12
                          const colSpan = layoutCols === 12 ? 'col-span-full' : `col-span-${layoutCols}`
                        
                        return (
                          <div key={block.id} className={colSpan}>
                            <SortableBlock
                              block={block}
                              blockTypes={blockTypes}
                              isSelected={selectedBlock === block.id}
                              onSelect={() => handleSelectBlock(block.id)}
                              onUpdate={(updates) => updateBlock(block.id, updates)}
                              onDelete={() => removeBlock(block.id)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
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
                    onClick={handleCloseProperties}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                  ✕
                </button>
              </div>
              
              {/* Tabs pour Propriétés et Style */}
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPropertiesTab('content')}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      propertiesTab === 'content'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Contenu
                  </button>
                  <button
                    onClick={() => setPropertiesTab('style')}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      propertiesTab === 'style'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    🎨 Style
                  </button>
                </div>
              </div>

              {propertiesTab === 'content' ? (
                <BlockPropertiesPanel
                  block={history.state.find((b: Block) => b.id === selectedBlock)!}
                  blockType={blockTypes.find((bt: BlockType) => bt.name === history.state.find((b: Block) => b.id === selectedBlock)?.type)}
                  onUpdate={(updates) => updateBlock(selectedBlock, updates)}
                />
              ) : (
                <BlockStylePanel
                  block={history.state.find((b: Block) => b.id === selectedBlock)!}
                  onUpdate={(updates) => updateBlock(selectedBlock, updates)}
                />
              )}
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
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const blockType = blockTypes.find(bt => bt.name === block.type)

  // Calculer les tailles basées sur le nombre de colonnes (sur 12)
  const layoutCols = typeof block.layout === 'number' ? block.layout : 12
  const isSmall = layoutCols <= 4 // 1-4 colonnes = petit
  const isMedium = layoutCols > 4 && layoutCols <= 8 // 5-8 colonnes = moyen
  const isLarge = layoutCols > 8 // 9-12 colonnes = grand

  // Déterminer la taille du texte selon la largeur du bloc
  const getTextSize = () => {
    if (isSmall) return 'text-xs'
    if (isMedium) return 'text-xs sm:text-sm'
    return 'text-sm sm:text-base'
  }

  // Déterminer la taille de l'icône selon la largeur du bloc
  const getIconSize = () => {
    if (isSmall) return 'text-sm'
    if (isMedium) return 'text-base sm:text-lg'
    return 'text-lg sm:text-xl'
  }

  // Déterminer le padding selon la largeur du bloc
  const getPadding = () => {
    if (isSmall) return 'p-2'
    if (isMedium) return 'p-2 sm:p-3'
    return 'p-3 sm:p-4'
  }

  // Déterminer la taille de l'icône container
  const getIconContainerSize = () => {
    if (isSmall) return 'w-6 h-6 sm:w-7 sm:h-7'
    if (isMedium) return 'w-7 h-7 sm:w-8 sm:h-8'
    return 'w-8 h-8 sm:w-10 sm:h-10'
  }

  // Déterminer la taille des boutons
  const getButtonSize = () => {
    if (isSmall) return 'p-1.5'
    if (isMedium) return 'p-1.5 sm:p-2'
    return 'p-2'
  }

  const getButtonIconSize = () => {
    if (isSmall) return 'w-3 h-3 sm:w-4 sm:h-4'
    if (isMedium) return 'w-3.5 h-3.5 sm:w-4 sm:h-4'
    return 'w-4 h-4 sm:w-5 sm:h-5'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full mb-4 bg-white dark:bg-gray-800 rounded-xl border-2 ${isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700'} shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden min-h-[80px]`}
    >
      {/* Block Header - Modern Design */}
      <div
        className={`flex items-center justify-between ${getPadding()} cursor-move transition-colors ${
          isSelected 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-b border-blue-200 dark:border-blue-700' 
            : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-800'
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <div className={`flex-shrink-0 ${getIconContainerSize()} rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700`}>
            <span className={getIconSize()}>{blockType?.icon || '📦'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className={`${getTextSize()} font-semibold text-gray-900 dark:text-gray-100 truncate block`}>{blockType?.label || block.type}</span>
            {blockType?.description && layoutCols > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate block hidden sm:block">{blockType.description}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 z-10 relative">
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              e.preventDefault()
              onSelect()
            }}
            className={`${getButtonSize()} rounded-lg transition-all relative z-10 ${
              isSelected 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            title="Sélectionner"
            type="button"
          >
            <svg className={getButtonIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              // Suppression immédiate sans attendre
              onDelete()
            }}
            className={`${getButtonSize()} rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors relative z-10`}
            title="Supprimer"
            type="button"
          >
            <svg className={getButtonIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Block Content - Modern Design */}
      <div className={`${isSmall ? 'p-2 sm:p-3' : 'p-4 sm:p-6'} bg-white dark:bg-gray-800`}>
        {/* Layout Controls - Enhanced */}
        <div className={`mb-4 ${isSmall ? 'p-2' : 'p-3'} bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700`}>
          <div className={`flex items-center ${isSmall ? 'gap-1.5 flex-wrap' : 'gap-3 flex-wrap'}`}>
            <div className={`flex items-center ${isSmall ? 'gap-1' : 'gap-2'}`}>
              <svg className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500 dark:text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              <span className={`${isSmall ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300 ${layoutCols <= 2 ? 'hidden sm:inline' : ''}`}>Largeur:</span>
              <select
                value={layoutCols}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate({ layout: parseInt(e.target.value) as Block['layout'] })}
                className={`${isSmall ? 'text-[10px] px-1.5 py-1' : 'text-xs px-3 py-1.5'} border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                onClick={(e: React.MouseEvent<HTMLSelectElement>) => e.stopPropagation()}
                title="Nombre de colonnes sur 12 (système Bootstrap)"
              >
                <option value={12}>12/12 (Pleine largeur)</option>
                <option value={11}>11/12</option>
                <option value={10}>10/12</option>
                <option value={9}>9/12 (3/4)</option>
                <option value={8}>8/12 (2/3)</option>
                <option value={7}>7/12</option>
                <option value={6}>6/12 (1/2)</option>
                <option value={5}>5/12</option>
                <option value={4}>4/12 (1/3)</option>
                <option value={3}>3/12 (1/4)</option>
                <option value={2}>2/12 (1/6)</option>
                <option value={1}>1/12</option>
              </select>
            </div>
            <div className={`flex items-center ${isSmall ? 'gap-1' : 'gap-2'}`}>
              <svg className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500 dark:text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className={`${isSmall ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300 ${layoutCols <= 2 ? 'hidden sm:inline' : ''}`}>Conteneur:</span>
              <select
                value={block.container || 'container'}
                onChange={(e) => onUpdate({ container: e.target.value as Block['container'] })}
                className={`${isSmall ? 'text-[10px] px-1.5 py-1' : 'text-xs px-3 py-1.5'} border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
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
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contenu (éditeur simple)
            </label>
            <textarea
              value={block.data.content || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, content: e.target.value } })}
              className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Entrez votre texte..."
              rows={6}
            />
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Astuce: Utilisez le bloc "Paragraphe" pour un texte long formaté ou le bloc "Ligne" pour un texte court sur une ligne.
            </p>
          </div>
        </div>
      )
    case 'heading':
      const headingLevel = block.data.level || 'h2'
      const HeadingTag = headingLevel as keyof JSX.IntrinsicElements
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte du titre
            </label>
            <input
              type="text"
              value={block.data.text || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, text: e.target.value } })}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg sm:text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Titre..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Niveau
              </label>
              <select
                value={headingLevel}
                onChange={(e) => onUpdate({ data: { ...block.data, level: e.target.value } })}
                className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="h1">H1 (Très grand)</option>
                <option value="h2">H2 (Grand)</option>
                <option value="h3">H3 (Moyen)</option>
                <option value="h4">H4 (Petit)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alignement
              </label>
              <select
                value={block.data.align || 'left'}
                onChange={(e) => onUpdate({ data: { ...block.data, align: e.target.value } })}
                className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Couleur du titre
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.data.color || '#000000'}
                onChange={(e) => onUpdate({ data: { ...block.data, color: e.target.value } })}
                className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={block.data.color || '#000000'}
                onChange={(e) => onUpdate({ data: { ...block.data, color: e.target.value } })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="#000000"
              />
            </div>
          </div>
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
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Texte du bouton..."
          />
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL du lien
            </label>
            <UrlInputWithSuggestions
              value={block.data.url || ''}
              onChange={(url) => onUpdate({ data: { ...block.data, url } })}
              placeholder="URL ou sélectionner une page..."
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Style
              </label>
              <select
                value={block.data.style || 'primary'}
                onChange={(e) => onUpdate({ data: { ...block.data, style: e.target.value } })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="primary">Primaire</option>
                <option value="secondary">Secondaire</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost</option>
                <option value="link">Lien</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taille
              </label>
              <select
                value={block.data.size || 'md'}
                onChange={(e) => onUpdate({ data: { ...block.data, size: e.target.value } })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="xs">Très petit</option>
                <option value="sm">Petit</option>
                <option value="md">Moyen</option>
                <option value="lg">Grand</option>
                <option value="xl">Très grand</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Couleur de fond
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.data.bg_color || '#3b82f6'}
                onChange={(e) => onUpdate({ data: { ...block.data, bg_color: e.target.value } })}
                className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={block.data.bg_color || '#3b82f6'}
                onChange={(e) => onUpdate({ data: { ...block.data, bg_color: e.target.value } })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="#3b82f6"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Couleur du texte
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.data.text_color || '#ffffff'}
                onChange={(e) => onUpdate({ data: { ...block.data, text_color: e.target.value } })}
                className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={block.data.text_color || '#ffffff'}
                onChange={(e) => onUpdate({ data: { ...block.data, text_color: e.target.value } })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`button-full-width-${block.id}`}
              checked={block.data.full_width || false}
              onChange={(e) => onUpdate({ data: { ...block.data, full_width: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`button-full-width-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Largeur complète
            </label>
          </div>
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
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Direction
            </label>
            <select
              value={block.data.direction || 'vertical'}
              onChange={(e) => onUpdate({ data: { ...block.data, direction: e.target.value } })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="vertical">Vertical (hauteur)</option>
              <option value="horizontal">Horizontal (largeur)</option>
            </select>
          </div>
          {block.data.direction === 'horizontal' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Largeur (px)
                </label>
                <input
                  type="number"
                  value={block.data.width || 40}
                  onChange={(e) => onUpdate({ data: { ...block.data, width: parseInt(e.target.value) || 40 } })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Largeur en pixels..."
                  min={10}
                  max={200}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Espaceur horizontal de {(block.data.width || 40)}px</p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hauteur (px)
                </label>
                <input
                  type="number"
                  value={block.data.height || 40}
                  onChange={(e) => onUpdate({ data: { ...block.data, height: parseInt(e.target.value) || 40 } })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Hauteur en pixels..."
                  min={10}
                  max={200}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Espaceur vertical de {(block.data.height || 40)}px</p>
            </>
          )}
        </div>
      )
    case 'divider':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Direction
            </label>
            <select
              value={block.data.direction || 'horizontal'}
              onChange={(e) => onUpdate({ data: { ...block.data, direction: e.target.value } })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="horizontal">Horizontal (ligne)</option>
              <option value="vertical">Vertical (colonne)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Style
            </label>
            <select
              value={block.data.style || 'solid'}
              onChange={(e) => onUpdate({ data: { ...block.data, style: e.target.value } })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="solid">Solide</option>
              <option value="dashed">Tirets</option>
              <option value="dotted">Pointillés</option>
              <option value="double">Double</option>
            </select>
          </div>
          {block.data.direction === 'horizontal' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Largeur
              </label>
              <select
                value={block.data.width || 'full'}
                onChange={(e) => onUpdate({ data: { ...block.data, width: e.target.value } })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="full">100%</option>
                <option value="half">50%</option>
                <option value="third">33%</option>
              </select>
            </div>
          )}
          {block.data.direction === 'vertical' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hauteur
              </label>
              <input
                type="number"
                value={block.data.height || 100}
                onChange={(e) => onUpdate({ data: { ...block.data, height: parseInt(e.target.value) || 100 } })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Hauteur en pixels..."
                min={20}
                max={500}
              />
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Séparateur {block.data.direction === 'horizontal' ? 'horizontal' : 'vertical'} {block.data.style || 'solid'}
          </p>
        </div>
      )
    case 'alert':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type d'alerte
            </label>
            <select
              value={block.data.variant || 'info'}
              onChange={(e) => onUpdate({ data: { ...block.data, variant: e.target.value } })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="info">Information (Bleu)</option>
              <option value="success">Succès (Vert)</option>
              <option value="warning">Avertissement (Jaune)</option>
              <option value="error">Erreur (Rouge)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Titre de l'alerte..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={block.data.message || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, message: e.target.value } })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Message de l'alerte..."
              rows={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`alert-dismissible-${block.id}`}
              checked={block.data.dismissible || false}
              onChange={(e) => onUpdate({ data: { ...block.data, dismissible: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`alert-dismissible-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Permettre la fermeture (bouton X)
            </label>
          </div>
          {(!block.data.message) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Voir la prévisualisation à droite →</p>
          )}
        </div>
      )
    case 'code':
      const commonLanguages = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'c', label: 'C' },
        { value: 'csharp', label: 'C#' },
        { value: 'php', label: 'PHP' },
        { value: 'ruby', label: 'Ruby' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' },
        { value: 'scss', label: 'SCSS' },
        { value: 'json', label: 'JSON' },
        { value: 'xml', label: 'XML' },
        { value: 'sql', label: 'SQL' },
        { value: 'bash', label: 'Bash' },
        { value: 'shell', label: 'Shell' },
        { value: 'yaml', label: 'YAML' },
        { value: 'markdown', label: 'Markdown' },
        { value: 'plaintext', label: 'Texte brut' },
      ]
      
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Langage de programmation
            </label>
            <select
              value={block.data.language || 'plaintext'}
              onChange={(e) => onUpdate({ data: { ...block.data, language: e.target.value } })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {commonLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code source
            </label>
            <textarea
              value={block.data.code || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, code: e.target.value } })}
              className="w-full p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Entrez votre code ici..."
              rows={10}
              spellCheck={false}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`code-line-numbers-${block.id}`}
                checked={block.data.showLineNumbers || false}
                onChange={(e) => onUpdate({ data: { ...block.data, showLineNumbers: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`code-line-numbers-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Afficher les numéros de ligne
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`code-copy-button-${block.id}`}
                checked={block.data.showCopyButton !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, showCopyButton: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`code-copy-button-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Bouton copier
              </label>
            </div>
          </div>
          {(!block.data.code) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Voir la prévisualisation à droite →</p>
          )}
        </div>
      )
    case 'table':
      const rows = block.data.rows || 3
      const cols = block.data.columns || 3
      const tableData = block.data.table_data || Array(rows).fill(null).map(() => Array(cols).fill(''))
      
      const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...tableData]
        if (!newData[rowIndex]) newData[rowIndex] = []
        newData[rowIndex][colIndex] = value
        onUpdate({ data: { ...block.data, table_data: newData } })
      }
      
      const addRow = () => {
        const newData = [...tableData, Array(cols).fill('')]
        onUpdate({ data: { ...block.data, rows: rows + 1, table_data: newData } })
      }
      
      const removeRow = () => {
        if (rows > 1) {
          const newData = tableData.slice(0, -1)
          onUpdate({ data: { ...block.data, rows: rows - 1, table_data: newData } })
        }
      }
      
      const addColumn = () => {
        const newData = tableData.map(row => [...row, ''])
        onUpdate({ data: { ...block.data, columns: cols + 1, table_data: newData } })
      }
      
      const removeColumn = () => {
        if (cols > 1) {
          const newData = tableData.map(row => row.slice(0, -1))
          onUpdate({ data: { ...block.data, columns: cols - 1, table_data: newData } })
        }
      }
      
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lignes</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={rows}
                  onChange={(e) => {
                    const newRows = parseInt(e.target.value) || 1
                    const newData = Array(newRows).fill(null).map((_, i) => tableData[i] || Array(cols).fill(''))
                    onUpdate({ data: { ...block.data, rows: newRows, table_data: newData } })
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  min={1}
                  max={20}
                />
                <button onClick={addRow} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">+</button>
                <button onClick={removeRow} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">-</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Colonnes</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={cols}
                  onChange={(e) => {
                    const newCols = parseInt(e.target.value) || 1
                    const newData = tableData.map(row => [...row.slice(0, newCols), ...Array(Math.max(0, newCols - row.length)).fill('')])
                    onUpdate({ data: { ...block.data, columns: newCols, table_data: newData } })
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  min={1}
                  max={20}
                />
                <button onClick={addColumn} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">+</button>
                <button onClick={removeColumn} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">-</button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu du tableau</label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <tbody>
                  {tableData.map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, colIndex: number) => (
                        <td key={colIndex} className="p-1 border border-gray-200 dark:border-gray-700">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-blue-500 bg-transparent"
                            placeholder={`Cellule ${rowIndex + 1},${colIndex + 1}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`table-header-${block.id}`}
              checked={block.data.has_header || false}
              onChange={(e) => onUpdate({ data: { ...block.data, has_header: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`table-header-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Première ligne en en-tête
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`table-bordered-${block.id}`}
              checked={block.data.bordered !== false}
              onChange={(e) => onUpdate({ data: { ...block.data, bordered: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`table-bordered-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Bordures visibles
            </label>
          </div>
        </div>
      )
    case 'rows':
      const rowCount = block.data.rows_count || 2
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de lignes
            </label>
            <input
              type="number"
              value={rowCount}
              onChange={(e) => onUpdate({ data: { ...block.data, rows_count: parseInt(e.target.value) || 2 } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min={1}
              max={10}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Les lignes peuvent contenir des colonnes ou d'autres blocs
          </p>
        </div>
      )
    case 'paragraph':
      return (
        <div className="space-y-2">
          <textarea
            value={block.data.content || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, content: e.target.value } })}
            className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Entrez votre paragraphe..."
            rows={6}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Paragraphe complet avec formatage
          </p>
        </div>
      )
    case 'line':
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={block.data.text || ''}
            onChange={(e) => onUpdate({ data: { ...block.data, text: e.target.value } })}
            className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Texte sur une ligne..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Texte sur une seule ligne
          </p>
        </div>
      )
    case 'form-newsletter':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Inscrivez-vous à notre newsletter"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={block.data.description || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, description: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={2}
              placeholder="Recevez nos dernières actualités..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte du bouton
            </label>
            <input
              type="text"
              value={block.data.button_text || 'S\'inscrire'}
              onChange={(e) => onUpdate({ data: { ...block.data, button_text: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      )
    case 'form-search':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={block.data.placeholder || 'Rechercher...'}
              onChange={(e) => onUpdate({ data: { ...block.data, placeholder: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte du bouton
            </label>
            <input
              type="text"
              value={block.data.button_text || 'Rechercher'}
              onChange={(e) => onUpdate({ data: { ...block.data, button_text: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      )
    case 'form-inscription':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Créer un compte"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`form-inscription-name-${block.id}`}
                checked={block.data.show_name !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_name: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`form-inscription-name-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Champ Nom
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`form-inscription-email-${block.id}`}
                checked={block.data.show_email !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_email: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`form-inscription-email-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Champ Email
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`form-inscription-password-${block.id}`}
                checked={block.data.show_password !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_password: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`form-inscription-password-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Champ Mot de passe
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`form-inscription-phone-${block.id}`}
                checked={block.data.show_phone || false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_phone: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`form-inscription-phone-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Champ Téléphone
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte du bouton
            </label>
            <input
              type="text"
              value={block.data.button_text || 'S\'inscrire'}
              onChange={(e) => onUpdate({ data: { ...block.data, button_text: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      )
    case 'testimonials':
      const testimonials = block.data.testimonials || [{ name: '', role: '', content: '', avatar: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Témoignages de nos clients"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Témoignages ({testimonials.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testimonials.map((testimonial: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={testimonial.name || ''}
                    onChange={(e) => {
                      const newTestimonials = [...testimonials]
                      newTestimonials[index] = { ...testimonial, name: e.target.value }
                      onUpdate({ data: { ...block.data, testimonials: newTestimonials } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Nom"
                  />
                  <input
                    type="text"
                    value={testimonial.role || ''}
                    onChange={(e) => {
                      const newTestimonials = [...testimonials]
                      newTestimonials[index] = { ...testimonial, role: e.target.value }
                      onUpdate({ data: { ...block.data, testimonials: newTestimonials } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Rôle/Poste"
                  />
                  <textarea
                    value={testimonial.content || ''}
                    onChange={(e) => {
                      const newTestimonials = [...testimonials]
                      newTestimonials[index] = { ...testimonial, content: e.target.value }
                      onUpdate({ data: { ...block.data, testimonials: newTestimonials } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Témoignage"
                    rows={2}
                  />
                  <input
                    type="url"
                    value={testimonial.avatar || ''}
                    onChange={(e) => {
                      const newTestimonials = [...testimonials]
                      newTestimonials[index] = { ...testimonial, avatar: e.target.value }
                      onUpdate({ data: { ...block.data, testimonials: newTestimonials } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="URL avatar (optionnel)"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, testimonials: [...testimonials, { name: '', role: '', content: '', avatar: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {testimonials.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, testimonials: testimonials.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'pricing':
      const plans = block.data.plans || [{ name: '', price: '', features: [''], button_text: '', button_url: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Nos tarifs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Forfaits ({plans.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {plans.map((plan: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={plan.name || ''}
                    onChange={(e) => {
                      const newPlans = [...plans]
                      newPlans[index] = { ...plan, name: e.target.value }
                      onUpdate({ data: { ...block.data, plans: newPlans } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Nom du forfait"
                  />
                  <input
                    type="text"
                    value={plan.price || ''}
                    onChange={(e) => {
                      const newPlans = [...plans]
                      newPlans[index] = { ...plan, price: e.target.value }
                      onUpdate({ data: { ...block.data, plans: newPlans } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Prix (ex: 29€/mois)"
                  />
                  <textarea
                    value={(plan.features || []).join('\n')}
                    onChange={(e) => {
                      const newPlans = [...plans]
                      newPlans[index] = { ...plan, features: e.target.value.split('\n').filter(f => f.trim()) }
                      onUpdate({ data: { ...block.data, plans: newPlans } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Fonctionnalités (une par ligne)"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={plan.button_text || ''}
                      onChange={(e) => {
                        const newPlans = [...plans]
                        newPlans[index] = { ...plan, button_text: e.target.value }
                        onUpdate({ data: { ...block.data, plans: newPlans } })
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      placeholder="Texte bouton"
                    />
                    <UrlInputWithSuggestions
                      value={plan.button_url || ''}
                      onChange={(url) => {
                        const newPlans = [...plans]
                        newPlans[index] = { ...plan, button_url: url }
                        onUpdate({ data: { ...block.data, plans: newPlans } })
                      }}
                      placeholder="URL"
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, plans: [...plans, { name: '', price: '', features: [''], button_text: '', button_url: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {plans.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, plans: plans.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'timeline':
      const events = block.data.events || [{ date: '', title: '', description: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Notre histoire"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Événements ({events.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((event: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={event.date || ''}
                    onChange={(e) => {
                      const newEvents = [...events]
                      newEvents[index] = { ...event, date: e.target.value }
                      onUpdate({ data: { ...block.data, events: newEvents } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Date (ex: 2024)"
                  />
                  <input
                    type="text"
                    value={event.title || ''}
                    onChange={(e) => {
                      const newEvents = [...events]
                      newEvents[index] = { ...event, title: e.target.value }
                      onUpdate({ data: { ...block.data, events: newEvents } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Titre"
                  />
                  <textarea
                    value={event.description || ''}
                    onChange={(e) => {
                      const newEvents = [...events]
                      newEvents[index] = { ...event, description: e.target.value }
                      onUpdate({ data: { ...block.data, events: newEvents } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Description"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, events: [...events, { date: '', title: '', description: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {events.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, events: events.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'accordion':
      const items = block.data.items || [{ title: '', content: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Questions fréquentes"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Éléments ({items.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index] = { ...item, title: e.target.value }
                      onUpdate({ data: { ...block.data, items: newItems } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Titre"
                  />
                  <textarea
                    value={item.content || ''}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index] = { ...item, content: e.target.value }
                      onUpdate({ data: { ...block.data, items: newItems } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Contenu"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, items: [...items, { title: '', content: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {items.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, items: items.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'stats':
      const stats = block.data.stats || [{ label: '', value: '', icon: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Nos statistiques"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statistiques ({stats.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.map((stat: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={stat.value || ''}
                    onChange={(e) => {
                      const newStats = [...stats]
                      newStats[index] = { ...stat, value: e.target.value }
                      onUpdate({ data: { ...block.data, stats: newStats } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Valeur (ex: 1000+)"
                  />
                  <input
                    type="text"
                    value={stat.label || ''}
                    onChange={(e) => {
                      const newStats = [...stats]
                      newStats[index] = { ...stat, label: e.target.value }
                      onUpdate({ data: { ...block.data, stats: newStats } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Label (ex: Clients satisfaits)"
                  />
                  <input
                    type="text"
                    value={stat.icon || ''}
                    onChange={(e) => {
                      const newStats = [...stats]
                      newStats[index] = { ...stat, icon: e.target.value }
                      onUpdate({ data: { ...block.data, stats: newStats } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Icône emoji (ex: 👥)"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, stats: [...stats, { label: '', value: '', icon: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {stats.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, stats: stats.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'social-links':
      const links = block.data.links || [{ platform: '', url: '', icon: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Suivez-nous"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Liens sociaux ({links.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {links.map((link: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={link.platform || ''}
                    onChange={(e) => {
                      const newLinks = [...links]
                      newLinks[index] = { ...link, platform: e.target.value }
                      onUpdate({ data: { ...block.data, links: newLinks } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Plateforme (ex: Facebook)"
                  />
                  <UrlInputWithSuggestions
                    value={link.url || ''}
                    onChange={(url) => {
                      const newLinks = [...links]
                      newLinks[index] = { ...link, url }
                      onUpdate({ data: { ...block.data, links: newLinks } })
                    }}
                    placeholder="URL"
                    className="text-xs"
                  />
                  <input
                    type="text"
                    value={link.icon || ''}
                    onChange={(e) => {
                      const newLinks = [...links]
                      newLinks[index] = { ...link, icon: e.target.value }
                      onUpdate({ data: { ...block.data, links: newLinks } })
                    }}
                    className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Icône emoji (ex: 📘)"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, links: [...links, { platform: '', url: '', icon: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {links.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, links: links.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'booking-form':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre du formulaire
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Réservez votre course"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`booking-pickup-${block.id}`}
                checked={block.data.show_pickup !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_pickup: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`booking-pickup-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Point de prise en charge
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`booking-dropoff-${block.id}`}
                checked={block.data.show_dropoff !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_dropoff: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`booking-dropoff-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Point de destination
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`booking-date-${block.id}`}
                checked={block.data.show_date !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_date: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`booking-date-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Date et heure
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`booking-passengers-${block.id}`}
                checked={block.data.show_passengers || false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_passengers: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`booking-passengers-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Nombre de passagers
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`booking-vehicle-${block.id}`}
                checked={block.data.show_vehicle || false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_vehicle: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`booking-vehicle-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Type de véhicule
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`booking-phone-${block.id}`}
                checked={block.data.show_phone !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_phone: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`booking-phone-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Téléphone
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`booking-notes-${block.id}`}
                checked={block.data.show_notes || false}
                onChange={(e) => onUpdate({ data: { ...block.data, show_notes: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`booking-notes-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Notes spéciales
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte du bouton
            </label>
            <input
              type="text"
              value={block.data.button_text || 'Réserver'}
              onChange={(e) => onUpdate({ data: { ...block.data, button_text: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      )
    case 'pricing-table':
      const pricingRows = block.data.rows || [{ route: '', price: '', duration: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Nos tarifs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lignes de tarifs ({pricingRows.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pricingRows.map((row: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={row.route || ''}
                    onChange={(e) => {
                      const newRows = [...pricingRows]
                      newRows[index] = { ...row, route: e.target.value }
                      onUpdate({ data: { ...block.data, rows: newRows } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Trajet (ex: Aéroport → Centre-ville)"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={row.price || ''}
                      onChange={(e) => {
                        const newRows = [...pricingRows]
                        newRows[index] = { ...row, price: e.target.value }
                        onUpdate({ data: { ...block.data, rows: newRows } })
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      placeholder="Prix (ex: 45€)"
                    />
                    <input
                      type="text"
                      value={row.duration || ''}
                      onChange={(e) => {
                        const newRows = [...pricingRows]
                        newRows[index] = { ...row, duration: e.target.value }
                        onUpdate({ data: { ...block.data, rows: newRows } })
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      placeholder="Durée (ex: 30 min)"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, rows: [...pricingRows, { route: '', price: '', duration: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {pricingRows.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, rows: pricingRows.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'service-zones':
      const zones = block.data.zones || [{ name: '', description: '', icon: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Zones de service"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zones ({zones.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {zones.map((zone: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={zone.name || ''}
                    onChange={(e) => {
                      const newZones = [...zones]
                      newZones[index] = { ...zone, name: e.target.value }
                      onUpdate({ data: { ...block.data, zones: newZones } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Nom de la zone"
                  />
                  <textarea
                    value={zone.description || ''}
                    onChange={(e) => {
                      const newZones = [...zones]
                      newZones[index] = { ...zone, description: e.target.value }
                      onUpdate({ data: { ...block.data, zones: newZones } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Description"
                    rows={2}
                  />
                  <input
                    type="text"
                    value={zone.icon || ''}
                    onChange={(e) => {
                      const newZones = [...zones]
                      newZones[index] = { ...zone, icon: e.target.value }
                      onUpdate({ data: { ...block.data, zones: newZones } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Icône emoji (ex: 🚗)"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, zones: [...zones, { name: '', description: '', icon: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {zones.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, zones: zones.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'vehicle-gallery':
      const vehicles = block.data.vehicles || [{ name: '', image: '', description: '', features: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Notre flotte"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Véhicules ({vehicles.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {vehicles.map((vehicle: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={vehicle.name || ''}
                    onChange={(e) => {
                      const newVehicles = [...vehicles]
                      newVehicles[index] = { ...vehicle, name: e.target.value }
                      onUpdate({ data: { ...block.data, vehicles: newVehicles } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Nom du véhicule"
                  />
                  <input
                    type="url"
                    value={vehicle.image || ''}
                    onChange={(e) => {
                      const newVehicles = [...vehicles]
                      newVehicles[index] = { ...vehicle, image: e.target.value }
                      onUpdate({ data: { ...block.data, vehicles: newVehicles } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="URL image"
                  />
                  <textarea
                    value={vehicle.description || ''}
                    onChange={(e) => {
                      const newVehicles = [...vehicles]
                      newVehicles[index] = { ...vehicle, description: e.target.value }
                      onUpdate({ data: { ...block.data, vehicles: newVehicles } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Description"
                    rows={2}
                  />
                  <input
                    type="text"
                    value={vehicle.features || ''}
                    onChange={(e) => {
                      const newVehicles = [...vehicles]
                      newVehicles[index] = { ...vehicle, features: e.target.value }
                      onUpdate({ data: { ...block.data, vehicles: newVehicles } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Caractéristiques (ex: 4 places, WiFi, Climatisation)"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, vehicles: [...vehicles, { name: '', image: '', description: '', features: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {vehicles.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, vehicles: vehicles.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'contact-buttons':
      const contacts = block.data.contacts || [{ type: 'phone', label: '', value: '', icon: '' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Contactez-nous"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contacts ({contacts.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contacts.map((contact: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <select
                    value={contact.type || 'phone'}
                    onChange={(e) => {
                      const newContacts = [...contacts]
                      newContacts[index] = { ...contact, type: e.target.value }
                      onUpdate({ data: { ...block.data, contacts: newContacts } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  >
                    <option value="phone">Téléphone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                  <input
                    type="text"
                    value={contact.label || ''}
                    onChange={(e) => {
                      const newContacts = [...contacts]
                      newContacts[index] = { ...contact, label: e.target.value }
                      onUpdate({ data: { ...block.data, contacts: newContacts } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Label (ex: Appelez-nous)"
                  />
                  <input
                    type="text"
                    value={contact.value || ''}
                    onChange={(e) => {
                      const newContacts = [...contacts]
                      newContacts[index] = { ...contact, value: e.target.value }
                      onUpdate({ data: { ...block.data, contacts: newContacts } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Valeur (ex: +33 6 12 34 56 78)"
                  />
                  <input
                    type="text"
                    value={contact.icon || ''}
                    onChange={(e) => {
                      const newContacts = [...contacts]
                      newContacts[index] = { ...contact, icon: e.target.value }
                      onUpdate({ data: { ...block.data, contacts: newContacts } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Icône emoji (ex: 📞)"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, contacts: [...contacts, { type: 'phone', label: '', value: '', icon: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {contacts.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, contacts: contacts.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'map':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Notre zone de service"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse ou coordonnées
            </label>
            <input
              type="text"
              value={block.data.address || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, address: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Ex: Paris, France ou 48.8566, 2.3522"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hauteur de la carte (px)
            </label>
            <input
              type="number"
              value={block.data.height || 400}
              onChange={(e) => onUpdate({ data: { ...block.data, height: parseInt(e.target.value) || 400 } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min={200}
              max={800}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`map-zoom-${block.id}`}
              checked={block.data.show_controls || false}
              onChange={(e) => onUpdate({ data: { ...block.data, show_controls: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`map-zoom-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Afficher les contrôles (zoom, etc.)
            </label>
          </div>
        </div>
      )
    case 'badges':
      const badges = block.data.badges || [{ text: '', icon: '', color: 'blue' }]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Certifications et badges"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Badges ({badges.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {badges.map((badge: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={badge.text || ''}
                    onChange={(e) => {
                      const newBadges = [...badges]
                      newBadges[index] = { ...badge, text: e.target.value }
                      onUpdate({ data: { ...block.data, badges: newBadges } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Texte du badge"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={badge.icon || ''}
                      onChange={(e) => {
                        const newBadges = [...badges]
                        newBadges[index] = { ...badge, icon: e.target.value }
                        onUpdate({ data: { ...block.data, badges: newBadges } })
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      placeholder="Icône emoji"
                    />
                    <select
                      value={badge.color || 'blue'}
                      onChange={(e) => {
                        const newBadges = [...badges]
                        newBadges[index] = { ...badge, color: e.target.value }
                        onUpdate({ data: { ...block.data, badges: newBadges } })
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    >
                      <option value="blue">Bleu</option>
                      <option value="green">Vert</option>
                      <option value="red">Rouge</option>
                      <option value="yellow">Jaune</option>
                      <option value="purple">Violet</option>
                      <option value="gray">Gris</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, badges: [...badges, { text: '', icon: '', color: 'blue' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {badges.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, badges: badges.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'form':
      const formFields = block.data.fields || [
        { type: 'text', label: 'Nom', placeholder: 'Votre nom', required: true },
        { type: 'email', label: 'Email', placeholder: 'votre@email.com', required: true },
        { type: 'textarea', label: 'Message', placeholder: 'Votre message', required: true }
      ]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre du formulaire
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Formulaire de contact"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte du bouton
            </label>
            <input
              type="text"
              value={block.data.submit_text || 'Envoyer'}
              onChange={(e) => onUpdate({ data: { ...block.data, submit_text: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Champs du formulaire ({formFields.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formFields.map((field: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <select
                    value={field.type || 'text'}
                    onChange={(e) => {
                      const newFields = [...formFields]
                      newFields[index] = { ...field, type: e.target.value }
                      onUpdate({ data: { ...block.data, fields: newFields } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  >
                    <option value="text">Texte</option>
                    <option value="email">Email</option>
                    <option value="tel">Téléphone</option>
                    <option value="textarea">Zone de texte</option>
                    <option value="number">Nombre</option>
                    <option value="url">URL</option>
                    <option value="date">Date</option>
                  </select>
                  <input
                    type="text"
                    value={field.label || ''}
                    onChange={(e) => {
                      const newFields = [...formFields]
                      newFields[index] = { ...field, label: e.target.value }
                      onUpdate({ data: { ...block.data, fields: newFields } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Label du champ"
                  />
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => {
                      const newFields = [...formFields]
                      newFields[index] = { ...field, placeholder: e.target.value }
                      onUpdate({ data: { ...block.data, fields: newFields } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Placeholder"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`field-required-${block.id}-${index}`}
                      checked={field.required || false}
                      onChange={(e) => {
                        const newFields = [...formFields]
                        newFields[index] = { ...field, required: e.target.checked }
                        onUpdate({ data: { ...block.data, fields: newFields } })
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`field-required-${block.id}-${index}`} className="text-xs text-gray-700 dark:text-gray-300">
                      Champ requis
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, fields: [...formFields, { type: 'text', label: '', placeholder: '', required: false }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {formFields.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, fields: formFields.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'columns':
      const columnCount = block.data.columns_count || 2
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de colonnes
            </label>
            <input
              type="number"
              value={columnCount}
              onChange={(e) => onUpdate({ data: { ...block.data, columns_count: parseInt(e.target.value) || 2 } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min={2}
              max={6}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Espacement entre colonnes
            </label>
            <select
              value={block.styles?.gap || '1rem'}
              onChange={(e) => onUpdate({ styles: { ...block.styles, gap: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="0.5rem">Très serré</option>
              <option value="1rem">Normal</option>
              <option value="1.5rem">Espacé</option>
              <option value="2rem">Très espacé</option>
            </select>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Les colonnes peuvent contenir d'autres blocs. Ajoutez des blocs enfants pour remplir chaque colonne.
            </p>
          </div>
        </div>
      )
    case 'hero':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre principal
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Titre Hero"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sous-titre
            </label>
            <textarea
              value={block.data.subtitle || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, subtitle: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Sous-titre"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image de fond (URL)
            </label>
            <input
              type="url"
              value={block.data.background_image || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, background_image: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Texte bouton
              </label>
              <input
                type="text"
                value={block.data.button_text || ''}
                onChange={(e) => onUpdate({ data: { ...block.data, button_text: e.target.value } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="En savoir plus"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL bouton
              </label>
              <UrlInputWithSuggestions
                value={block.data.button_url || ''}
                onChange={(url) => onUpdate({ data: { ...block.data, button_url: url } })}
                placeholder="URL"
                className="text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`hero-overlay-${block.id}`}
              checked={block.data.overlay || false}
              onChange={(e) => onUpdate({ data: { ...block.data, overlay: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`hero-overlay-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Overlay sombre sur l'image
            </label>
          </div>
        </div>
      )
    case 'image':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL de l'image
            </label>
            <input
              type="url"
              value={block.data.url || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, url: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte alternatif
            </label>
            <input
              type="text"
              value={block.data.alt || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, alt: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Description de l'image"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Légende
            </label>
            <input
              type="text"
              value={block.data.caption || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, caption: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Légende (optionnel)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Largeur (%)
              </label>
              <input
                type="number"
                value={block.data.width || 100}
                onChange={(e) => onUpdate({ data: { ...block.data, width: parseInt(e.target.value) || 100 } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                min={10}
                max={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alignement
              </label>
              <select
                value={block.data.align || 'center'}
                onChange={(e) => onUpdate({ data: { ...block.data, align: e.target.value } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </div>
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL de la vidéo (YouTube, Vimeo, etc.)
            </label>
            <input
              type="url"
              value={block.data.url || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, url: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la vidéo
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Titre (optionnel)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Largeur (%)
              </label>
              <input
                type="number"
                value={block.data.width || 100}
                onChange={(e) => onUpdate({ data: { ...block.data, width: parseInt(e.target.value) || 100 } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                min={50}
                max={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hauteur (px)
              </label>
              <input
                type="number"
                value={block.data.height || 400}
                onChange={(e) => onUpdate({ data: { ...block.data, height: parseInt(e.target.value) || 400 } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                min={200}
                max={800}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`video-autoplay-${block.id}`}
              checked={block.data.autoplay || false}
              onChange={(e) => onUpdate({ data: { ...block.data, autoplay: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`video-autoplay-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Lecture automatique
            </label>
          </div>
        </div>
      )
    case 'gallery':
      const galleryImages = block.data.images || []
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de colonnes
            </label>
            <input
              type="number"
              value={block.data.columns || 3}
              onChange={(e) => onUpdate({ data: { ...block.data, columns: parseInt(e.target.value) || 3 } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min={1}
              max={6}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Images ({galleryImages.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {galleryImages.map((img: string, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => {
                      const newImages = [...galleryImages]
                      newImages[index] = e.target.value
                      onUpdate({ data: { ...block.data, images: newImages } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="URL de l'image"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, images: [...galleryImages, ''] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {galleryImages.length > 0 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, images: galleryImages.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'banner':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la bannière
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Titre de la bannière"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sous-titre (optionnel)
            </label>
            <input
              type="text"
              value={block.data.subtitle || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, subtitle: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Sous-titre"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image de fond (URL)
            </label>
            <input
              type="url"
              value={block.data.background_image || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, background_image: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hauteur minimale (px)
              </label>
              <input
                type="number"
                value={block.data.min_height || 400}
                onChange={(e) => onUpdate({ data: { ...block.data, min_height: parseInt(e.target.value) || 400 } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                min={200}
                max={1000}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alignement du texte
              </label>
              <select
                value={block.data.text_align || 'center'}
                onChange={(e) => onUpdate({ data: { ...block.data, text_align: e.target.value } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`banner-overlay-${block.id}`}
              checked={block.data.overlay || false}
              onChange={(e) => onUpdate({ data: { ...block.data, overlay: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`banner-overlay-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Overlay sombre sur l'image
            </label>
          </div>
          {block.data.button_text && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Texte bouton
                </label>
                <input
                  type="text"
                  value={block.data.button_text || ''}
                  onChange={(e) => onUpdate({ data: { ...block.data, button_text: e.target.value } })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL bouton
                </label>
                <UrlInputWithSuggestions
                  value={block.data.button_url || ''}
                  onChange={(url) => onUpdate({ data: { ...block.data, button_url: url } })}
                  placeholder="URL"
                  className="text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )
    case 'footer':
      const footerLinks = block.data.links || []
      const footerColumns = block.data.columns || [
        { title: 'Liens rapides', links: [] },
        { title: 'Contact', links: [] },
        { title: 'Réseaux sociaux', links: [] }
      ]
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texte du copyright
            </label>
            <input
              type="text"
              value={block.data.copyright || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, copyright: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="© 2024 Votre Entreprise. Tous droits réservés."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Colonnes du footer ({footerColumns.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {footerColumns.map((column: any, colIndex: number) => (
                <div key={colIndex} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="text"
                    value={column.title || ''}
                    onChange={(e) => {
                      const newColumns = [...footerColumns]
                      newColumns[colIndex] = { ...column, title: e.target.value }
                      onUpdate({ data: { ...block.data, columns: newColumns } })
                    }}
                    className="w-full mb-2 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Titre de la colonne"
                  />
                  <div className="space-y-1">
                    {(column.links || []).map((link: any, linkIndex: number) => (
                      <div key={linkIndex} className="flex gap-1">
                        <UrlInputWithSuggestions
                          value={link.url || ''}
                          onChange={(url) => {
                            const newColumns = [...footerColumns]
                            const newLinks = [...(newColumns[colIndex].links || [])]
                            newLinks[linkIndex] = { ...link, url }
                            newColumns[colIndex] = { ...column, links: newLinks }
                            onUpdate({ data: { ...block.data, columns: newColumns } })
                          }}
                          placeholder="URL"
                          className="text-xs flex-1"
                        />
                        <input
                          type="text"
                          value={link.label || ''}
                          onChange={(e) => {
                            const newColumns = [...footerColumns]
                            const newLinks = [...(newColumns[colIndex].links || [])]
                            newLinks[linkIndex] = { ...link, label: e.target.value }
                            newColumns[colIndex] = { ...column, links: newLinks }
                            onUpdate({ data: { ...block.data, columns: newColumns } })
                          }}
                          className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          placeholder="Label"
                        />
                        <button
                          onClick={() => {
                            const newColumns = [...footerColumns]
                            newColumns[colIndex] = {
                              ...column,
                              links: (column.links || []).filter((_: any, i: number) => i !== linkIndex)
                            }
                            onUpdate({ data: { ...block.data, columns: newColumns } })
                          }}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newColumns = [...footerColumns]
                        newColumns[colIndex] = {
                          ...column,
                          links: [...(column.links || []), { label: '', url: '' }]
                        }
                        onUpdate({ data: { ...block.data, columns: newColumns } })
                      }}
                      className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      + Ajouter lien
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, columns: [...footerColumns, { title: '', links: [] }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter colonne
              </button>
              {footerColumns.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, columns: footerColumns.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer colonne
                </button>
              )}
            </div>
          </div>
        </div>
      )
    case 'section':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image de fond (URL) - Optionnel
            </label>
            <input
              type="url"
              value={block.data.background_image || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, background_image: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position de l'image
              </label>
              <select
                value={block.data.background_position || 'center'}
                onChange={(e) => onUpdate({ data: { ...block.data, background_position: e.target.value } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="center">Centre</option>
                <option value="top">Haut</option>
                <option value="bottom">Bas</option>
                <option value="left">Gauche</option>
                <option value="right">Droite</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taille de l'image
              </label>
              <select
                value={block.data.background_size || 'cover'}
                onChange={(e) => onUpdate({ data: { ...block.data, background_size: e.target.value } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="cover">Couvrir</option>
                <option value="contain">Contenir</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`section-overlay-${block.id}`}
              checked={block.data.overlay || false}
              onChange={(e) => onUpdate({ data: { ...block.data, overlay: e.target.checked } })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`section-overlay-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
              Overlay sombre sur l'image
            </label>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Cette section peut contenir d'autres blocs. Ajoutez des blocs enfants pour remplir la section.
            </p>
          </div>
        </div>
      )
    case 'carousel':
      const carouselItems = block.data.items || []
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Éléments du carousel ({carouselItems.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {carouselItems.map((item: any, index: number) => (
                <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <input
                    type="url"
                    value={item.image || ''}
                    onChange={(e) => {
                      const newItems = [...carouselItems]
                      newItems[index] = { ...item, image: e.target.value }
                      onUpdate({ data: { ...block.data, items: newItems } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="URL de l'image"
                  />
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => {
                      const newItems = [...carouselItems]
                      newItems[index] = { ...item, title: e.target.value }
                      onUpdate({ data: { ...block.data, items: newItems } })
                    }}
                    className="w-full mb-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Titre (optionnel)"
                  />
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => {
                      const newItems = [...carouselItems]
                      newItems[index] = { ...item, description: e.target.value }
                      onUpdate({ data: { ...block.data, items: newItems } })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Description (optionnel)"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onUpdate({ data: { ...block.data, items: [...carouselItems, { image: '', title: '', description: '' }] } })}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Ajouter
              </button>
              {carouselItems.length > 1 && (
                <button
                  onClick={() => onUpdate({ data: { ...block.data, items: carouselItems.slice(0, -1) } })}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  - Supprimer
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vitesse (ms)
              </label>
              <input
                type="number"
                value={block.data.autoplay_speed || 3000}
                onChange={(e) => onUpdate({ data: { ...block.data, autoplay_speed: parseInt(e.target.value) || 3000 } })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                min={1000}
                max={10000}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id={`carousel-autoplay-${block.id}`}
                checked={block.data.autoplay !== false}
                onChange={(e) => onUpdate({ data: { ...block.data, autoplay: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`carousel-autoplay-${block.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                Lecture automatique
              </label>
            </div>
          </div>
        </div>
      )
    case 'countdown':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date cible
            </label>
            <input
              type="datetime-local"
              value={block.data.target_date || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, target_date: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, title: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Offre se termine dans..."
            />
          </div>
        </div>
      )
    case 'progress-bar':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Label
            </label>
            <input
              type="text"
              value={block.data.label || ''}
              onChange={(e) => onUpdate({ data: { ...block.data, label: e.target.value } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Compétence"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pourcentage (0-100)
            </label>
            <input
              type="number"
              value={block.data.percentage || 0}
              onChange={(e) => onUpdate({ data: { ...block.data, percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Couleur de la barre
            </label>
            <input
              type="color"
              value={block.data.color || '#3B82F6'}
              onChange={(e) => onUpdate({ data: { ...block.data, color: e.target.value } })}
              className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
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

// Block Style Panel (Peinture/Styling)
function BlockStylePanel({
  block,
  onUpdate,
  allBlocks = [],
  blockTypes = [],
}: {
  block: Block
  onUpdate: (updates: Partial<Block>) => void
  allBlocks?: Block[]
  blockTypes?: BlockType[]
}) {
  const updateStyle = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...block.styles,
        [key]: value,
      },
    })
  }

  const commonColors = [
    { name: 'Blanc', value: '#ffffff', class: 'bg-white' },
    { name: 'Noir', value: '#000000', class: 'bg-black' },
    { name: 'Gris clair', value: '#f3f4f6', class: 'bg-gray-100' },
    { name: 'Gris', value: '#6b7280', class: 'bg-gray-500' },
    { name: 'Gris foncé', value: '#1f2937', class: 'bg-gray-800' },
    { name: 'Bleu', value: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Bleu foncé', value: '#1e40af', class: 'bg-blue-800' },
    { name: 'Vert', value: '#10b981', class: 'bg-green-500' },
    { name: 'Rouge', value: '#ef4444', class: 'bg-red-500' },
    { name: 'Jaune', value: '#f59e0b', class: 'bg-yellow-500' },
    { name: 'Violet', value: '#8b5cf6', class: 'bg-purple-500' },
    { name: 'Rose', value: '#ec4899', class: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Couleur de fond */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Couleur de fond
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={block.styles?.background_color || '#ffffff'}
            onChange={(e) => updateStyle('background_color', e.target.value)}
            className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={block.styles?.background_color || '#ffffff'}
            onChange={(e) => updateStyle('background_color', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="#ffffff"
          />
        </div>
        <div className="grid grid-cols-6 gap-1">
          {commonColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => updateStyle('background_color', color.value)}
              className={`w-full h-8 rounded border-2 ${
                block.styles?.background_color === color.value
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 dark:border-gray-600'
              } ${color.class}`}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Couleur de texte */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Couleur de texte
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={block.styles?.color || '#000000'}
            onChange={(e) => updateStyle('color', e.target.value)}
            className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={block.styles?.color || '#000000'}
            onChange={(e) => updateStyle('color', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Propriétés avancées - Premium */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Propriétés avancées</span>
          <span className="px-2 py-0.5 text-[10px] font-bold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">PREMIUM</span>
        </div>
        
        {/* Z-index */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Z-index (superposition)
          </label>
          <input
            type="number"
            value={block.styles?.z_index || 0}
            onChange={(e) => updateStyle('z_index', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="0"
          />
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            Contrôle la superposition des éléments (plus élevé = au-dessus)
          </p>
        </div>

        {/* Position */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type de position
          </label>
          <select
            value={block.position?.type || block.styles?.position || 'static'}
            onChange={(e) => {
              const positionType = e.target.value
              onUpdate({
                position: {
                  ...block.position,
                  type: positionType as 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
                },
                styles: {
                  ...block.styles,
                  position: positionType
                }
              })
            }}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="static">Statique (dans le flux)</option>
            <option value="relative">Relative (par rapport au flux)</option>
            <option value="absolute">Absolue (par rapport au parent)</option>
            <option value="fixed">Fixe (par rapport à la fenêtre)</option>
            <option value="sticky">Sticky (collant au scroll)</option>
          </select>
        </div>

        {/* Alignement */}
        {(block.position?.type === 'relative' || block.position?.type === 'absolute' || block.styles?.position === 'relative' || block.styles?.position === 'absolute') && (
          <>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alignement horizontal
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { value: 'left', icon: '←', label: 'Gauche' },
                  { value: 'center', icon: '↔', label: 'Centre' },
                  { value: 'right', icon: '→', label: 'Droite' },
                  { value: 'stretch', icon: '↔', label: 'Étirer' }
                ].map((align) => (
                  <button
                    key={align.value}
                    type="button"
                    onClick={() => onUpdate({
                      position: {
                        ...block.position,
                        align: align.value as 'left' | 'center' | 'right' | 'stretch'
                      }
                    })}
                    className={`px-2 py-1.5 text-xs rounded border transition-all ${
                      (block.position?.align || 'left') === align.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    }`}
                    title={align.label}
                  >
                    <span className="text-sm">{align.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coordonnées pour position absolute */}
            {block.position?.type === 'absolute' && (
              <div className="mb-3 space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Position (px ou %)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Top</label>
                    <input
                      type="text"
                      value={block.position?.top || ''}
                      onChange={(e) => onUpdate({
                        position: {
                          ...block.position,
                          top: e.target.value
                        },
                        styles: {
                          ...block.styles,
                          top: e.target.value
                        }
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Right</label>
                    <input
                      type="text"
                      value={block.position?.right || ''}
                      onChange={(e) => onUpdate({
                        position: {
                          ...block.position,
                          right: e.target.value
                        },
                        styles: {
                          ...block.styles,
                          right: e.target.value
                        }
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Bottom</label>
                    <input
                      type="text"
                      value={block.position?.bottom || ''}
                      onChange={(e) => onUpdate({
                        position: {
                          ...block.position,
                          bottom: e.target.value
                        },
                        styles: {
                          ...block.styles,
                          bottom: e.target.value
                        }
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Left</label>
                    <input
                      type="text"
                      value={block.position?.left || ''}
                      onChange={(e) => onUpdate({
                        position: {
                          ...block.position,
                          left: e.target.value
                        },
                        styles: {
                          ...block.styles,
                          left: e.target.value
                        }
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="0px"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bloc de référence pour position relative */}
            {block.position?.type === 'relative' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aligner par rapport à un autre bloc (optionnel)
                </label>
                <select
                  value={block.position?.alignTo || ''}
                  onChange={(e) => onUpdate({
                    position: {
                      ...block.position,
                      alignTo: e.target.value || undefined
                    }
                  })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Aucun (alignement normal)</option>
                  {/* Les options seront remplies dynamiquement avec les autres blocs */}
                </select>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  Choisissez un bloc pour aligner celui-ci par rapport à lui
                </p>
              </div>
            )}
          </>
        )}

        {/* Overflow */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Overflow (débordement)
          </label>
          <select
            value={block.styles?.overflow || 'visible'}
            onChange={(e) => updateStyle('overflow', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="visible">Visible</option>
            <option value="hidden">Caché</option>
            <option value="scroll">Défilement</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        {/* Opacité */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Opacité (0-1)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={block.styles?.opacity || 1}
            onChange={(e) => updateStyle('opacity', parseFloat(e.target.value) || 1)}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Transform */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rotation (degrés)
          </label>
          <input
            type="number"
            value={block.styles?.transform_rotate || 0}
            onChange={(e) => {
              const rotate = parseInt(e.target.value) || 0
              updateStyle('transform', `rotate(${rotate}deg)`)
              updateStyle('transform_rotate', rotate)
            }}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="0"
          />
        </div>
      </div>

      {/* Padding */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Espacement interne (Padding)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Vertical</label>
            <input
              type="text"
              value={block.styles?.padding_vertical || ''}
              onChange={(e) => updateStyle('padding_vertical', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="1rem"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Horizontal</label>
            <input
              type="text"
              value={block.styles?.padding_horizontal || ''}
              onChange={(e) => updateStyle('padding_horizontal', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="1rem"
            />
          </div>
        </div>
        <div className="mt-2 flex gap-1">
          {['0', '0.5rem', '1rem', '2rem', '3rem', '4rem'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                updateStyle('padding_vertical', val)
                updateStyle('padding_horizontal', val)
              }}
              className={`flex-1 px-2 py-1 text-[10px] rounded border ${
                block.styles?.padding_vertical === val && block.styles?.padding_horizontal === val
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Espacement externe (Margin)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Vertical</label>
            <input
              type="text"
              value={block.styles?.margin_vertical || ''}
              onChange={(e) => updateStyle('margin_vertical', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Horizontal</label>
            <input
              type="text"
              value={block.styles?.margin_horizontal || ''}
              onChange={(e) => updateStyle('margin_horizontal', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Bordures */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bordures
        </label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Largeur</label>
              <select
                value={block.styles?.border_width || '0'}
                onChange={(e) => updateStyle('border_width', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="0">Aucune</option>
                <option value="1px">1px</option>
                <option value="2px">2px</option>
                <option value="4px">4px</option>
                <option value="8px">8px</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Style</label>
              <select
                value={block.styles?.border_style || 'solid'}
                onChange={(e) => updateStyle('border_style', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="solid">Solide</option>
                <option value="dashed">Tirets</option>
                <option value="dotted">Pointillés</option>
                <option value="double">Double</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Couleur</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.styles?.border_color || '#e5e7eb'}
                onChange={(e) => updateStyle('border_color', e.target.value)}
                className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={block.styles?.border_color || '#e5e7eb'}
                onChange={(e) => updateStyle('border_color', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="#e5e7eb"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Rayon (Border radius)</label>
            <select
              value={block.styles?.border_radius || '0'}
              onChange={(e) => updateStyle('border_radius', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="0">Aucun</option>
              <option value="0.25rem">Petit (0.25rem)</option>
              <option value="0.5rem">Moyen (0.5rem)</option>
              <option value="1rem">Grand (1rem)</option>
              <option value="1.5rem">Très grand (1.5rem)</option>
              <option value="9999px">Rond</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ombres */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ombres
        </label>
        <select
          value={block.styles?.box_shadow || 'none'}
          onChange={(e) => updateStyle('box_shadow', e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="none">Aucune</option>
          <option value="sm">Petite (sm)</option>
          <option value="md">Moyenne (md)</option>
          <option value="lg">Grande (lg)</option>
          <option value="xl">Très grande (xl)</option>
          <option value="2xl">Énorme (2xl)</option>
        </select>
      </div>

      {/* Alignement du texte */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alignement du texte
        </label>
        <div className="flex gap-1">
          {[
            { value: 'left', icon: '⬅️', label: 'Gauche' },
            { value: 'center', icon: '↔️', label: 'Centre' },
            { value: 'right', icon: '➡️', label: 'Droite' },
            { value: 'justify', icon: '↔️', label: 'Justifié' },
          ].map((align) => (
            <button
              key={align.value}
              type="button"
              onClick={() => updateStyle('text_align', align.value)}
              className={`flex-1 px-2 py-2 text-xs rounded border ${
                block.styles?.text_align === align.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              title={align.label}
            >
              {align.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
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
          {Object.entries(blockType.schema).map(([key, schema]) => {
            const schemaObj = schema as any
            return (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {schemaObj.label || key}
                </label>
                {schemaObj.type === 'text' && (
                  <input
                    type="text"
                    value={block.data[key] || ''}
                    onChange={(e) =>
                      onUpdate({
                        data: { ...block.data, [key]: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                {schemaObj.type === 'textarea' && (
                  <textarea
                    value={block.data[key] || ''}
                    onChange={(e) =>
                      onUpdate({
                        data: { ...block.data, [key]: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                )}
                {schemaObj.type === 'number' && (
                  <input
                    type="number"
                    value={block.data[key] || ''}
                    onChange={(e) =>
                      onUpdate({
                        data: { ...block.data, [key]: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                {(schemaObj.type === 'url' || 
                  (schemaObj.type === 'text' && (key.toLowerCase().includes('url') || key.toLowerCase().includes('link') || key.toLowerCase().includes('href')))) && (
                  <UrlInputWithSuggestions
                    value={block.data[key] || ''}
                    onChange={(url) =>
                      onUpdate({
                        data: { ...block.data, [key]: url },
                      })
                    }
                    placeholder={schemaObj.placeholder || 'URL ou sélectionner une page...'}
                    className="text-sm"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

