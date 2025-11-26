/**
 * Types TypeScript pour le système de blocs modulaires
 */

export type BlockCategory = 'content' | 'layout' | 'media' | 'custom'

export type BlockWidth = 'full' | 'half' | 'third' | 'quarter' | 'two-thirds' | 'three-quarters'
export type BlockAlignment = 'left' | 'center' | 'right'
export type ButtonStyle = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type VideoSource = 'youtube' | 'vimeo' | 'upload' | 'embed'
export type GalleryLayout = 'grid' | 'carousel' | 'masonry'
export type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'with-text'

/**
 * Styles personnalisés pour un bloc
 */
export interface BlockStyles {
  padding?: string
  margin?: string
  backgroundColor?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  fontSize?: string
  fontWeight?: string
  border?: string
  borderRadius?: string
  width?: string
  height?: string
  maxWidth?: string
  minHeight?: string
  [key: string]: any // Pour permettre des styles CSS personnalisés
}

/**
 * Paramètres généraux d'un bloc
 */
export interface BlockSettings {
  width?: BlockWidth
  alignment?: BlockAlignment
  visibleOnMobile?: boolean
  visibleOnTablet?: boolean
  visibleOnDesktop?: boolean
  customClass?: string
  customId?: string
  [key: string]: any
}

/**
 * Structure de base d'un bloc
 */
export interface Block {
  id: string
  type: string
  data: Record<string, any>
  styles?: BlockStyles
  settings?: BlockSettings
  order: number
}

/**
 * Données pour un bloc Texte
 */
export interface TextBlockData {
  content: string
  richText?: boolean
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  textAlign?: 'left' | 'center' | 'right' | 'justify'
}

/**
 * Données pour un bloc Image
 */
export interface ImageBlockData {
  url: string
  alt?: string
  caption?: string
  link?: string
  width?: string
  height?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

/**
 * Données pour un bloc Vidéo
 */
export interface VideoBlockData {
  source: VideoSource
  url?: string
  videoId?: string
  autoplay?: boolean
  loop?: boolean
  controls?: boolean
  muted?: boolean
  thumbnail?: string
  width?: string
  height?: string
}

/**
 * Données pour un bloc Bouton
 */
export interface ButtonBlockData {
  text: string
  url: string
  style?: ButtonStyle
  size?: ButtonSize
  icon?: string
  iconPosition?: 'left' | 'right'
  openInNewTab?: boolean
  disabled?: boolean
}

/**
 * Données pour un bloc Lien
 */
export interface LinkBlockData {
  text: string
  url: string
  openInNewTab?: boolean
  icon?: string
  underline?: boolean
}

/**
 * Données pour un bloc Code
 */
export interface CodeBlockData {
  html?: string
  css?: string
  javascript?: string
  language?: 'html' | 'css' | 'javascript' | 'mixed'
}

/**
 * Données pour un bloc Galerie
 */
export interface GalleryBlockData {
  images: Array<{
    url: string
    caption?: string
    alt?: string
    link?: string
  }>
  layout?: GalleryLayout
  columns?: number
  spacing?: string
  lightbox?: boolean
}

/**
 * Données pour un bloc Colonnes
 */
export interface ColumnsBlockData {
  columns: 2 | 3 | 4
  layout?: 'equal' | 'custom'
  columnWidths?: string[]
  blocks: Block[][] // Blocs imbriqués par colonne
  gap?: string
  responsive?: boolean
}

/**
 * Données pour un bloc Espaceur
 */
export interface SpacerBlockData {
  height: string
  responsive?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

/**
 * Données pour un bloc Divider
 */
export interface DividerBlockData {
  style?: DividerStyle
  color?: string
  thickness?: string
  text?: string
  alignment?: BlockAlignment
}

/**
 * Données pour un bloc Embed
 */
export interface EmbedBlockData {
  embedCode: string
  width?: string
  height?: string
  responsive?: boolean
  aspectRatio?: string
}

/**
 * Type de bloc disponible dans le système
 */
export interface BlockType {
  id: number
  name: string
  label: string
  icon: string
  category: BlockCategory
  description?: string
  schema?: Record<string, any>
  defaultStyles?: BlockStyles
  isActive: boolean
  requiresPremium?: boolean
  order: number
}

/**
 * Template de bloc réutilisable
 */
export interface BlockTemplate {
  id: number
  name: string
  description?: string
  blockType: BlockType
  blockData: Record<string, any>
  blockStyles?: BlockStyles
  blockSettings?: BlockSettings
  isGlobal: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

