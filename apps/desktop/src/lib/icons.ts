/**
 * The app's icon set: Phosphor, exposed under the names the app and the plugin SDK
 * (`icons` namespace) already use, so swapping the library never renames a call site.
 *
 * Each export wraps its Phosphor glyph with the app defaults: 24px (Phosphor's own
 * default is 1em) and `ICON_WEIGHT`. Defaults live here rather than in an
 * `IconContext` provider because the app mounts several React roots (main window,
 * pet overlay, wake indicator, quick entry). Props passed at a call site win.
 */
import {
  type Icon,
  type IconProps,
  type IconWeight,
  AppWindow as PhAppWindow,
  Archive as PhArchive,
  ArrowBendDownLeft as PhArrowBendDownLeft,
  ArrowLineDown as PhArrowLineDown,
  ArrowLineUp as PhArrowLineUp,
  ArrowsClockwise as PhArrowsClockwise,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowUp as PhArrowUp,
  ArrowUpRight as PhArrowUpRight,
  At as PhAt,
  Bell as PhBell,
  Book as PhBook,
  BookmarkSimple as PhBookmarkSimple,
  BoxArrowUp as PhBoxArrowUp,
  Brain as PhBrain,
  Browser as PhBrowser,
  Bug as PhBug,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  ChartBar as PhChartBar,
  ChatCenteredText as PhChatCenteredText,
  ChatCircle as PhChatCircle,
  ChatCircleDots as PhChatCircleDots,
  ChatText as PhChatText,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  Circle as PhCircle,
  CircleNotch as PhCircleNotch,
  Clipboard as PhClipboard,
  Clock as PhClock,
  Cloud as PhCloud,
  CloudArrowUp as PhCloudArrowUp,
  Command as PhCommand,
  Copy as PhCopy,
  CornersOut as PhCornersOut,
  Cpu as PhCpu,
  CreditCard as PhCreditCard,
  Cube as PhCube,
  Database as PhDatabase,
  Desktop as PhDesktop,
  DotsThree as PhDotsThree,
  DotsThreeVertical as PhDotsThreeVertical,
  DownloadSimple as PhDownloadSimple,
  Ear as PhEar,
  EarSlash as PhEarSlash,
  Egg as PhEgg,
  Eject as PhEject,
  Envelope as PhEnvelope,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  FileText as PhFileText,
  FloppyDisk as PhFloppyDisk,
  FolderOpen as PhFolderOpen,
  Funnel as PhFunnel,
  Gear as PhGear,
  GearSix as PhGearSix,
  GitBranch as PhGitBranch,
  GitFork as PhGitFork,
  Globe as PhGlobe,
  Graph as PhGraph,
  Hash as PhHash,
  Image as PhImage,
  Info as PhInfo,
  Key as PhKey,
  Keyboard as PhKeyboard,
  Lightning as PhLightning,
  Link as PhLink,
  Lock as PhLock,
  LockOpen as PhLockOpen,
  MagnifyingGlass as PhMagnifyingGlass,
  MagnifyingGlassMinus as PhMagnifyingGlassMinus,
  MagnifyingGlassPlus as PhMagnifyingGlassPlus,
  Microphone as PhMicrophone,
  MicrophoneSlash as PhMicrophoneSlash,
  MonitorPlay as PhMonitorPlay,
  Moon as PhMoon,
  Notebook as PhNotebook,
  Package as PhPackage,
  Palette as PhPalette,
  PaperPlaneRight as PhPaperPlaneRight,
  Pause as PhPause,
  PawPrint as PhPawPrint,
  PencilSimple as PhPencilSimple,
  PencilSimpleLine as PhPencilSimpleLine,
  Play as PhPlay,
  Plug as PhPlug,
  Plus as PhPlus,
  Power as PhPower,
  Pulse as PhPulse,
  PushPin as PhPushPin,
  PuzzlePiece as PhPuzzlePiece,
  QrCode as PhQrCode,
  Question as PhQuestion,
  Rows as PhRows,
  SealCheck as PhSealCheck,
  Shapes as PhShapes,
  ShieldCheck as PhShieldCheck,
  Sidebar as PhSidebar,
  SignIn as PhSignIn,
  SlackLogo as PhSlackLogo,
  SlidersHorizontal as PhSlidersHorizontal,
  SmileyWink as PhSmileyWink,
  SpeakerHigh as PhSpeakerHigh,
  SpeakerSlash as PhSpeakerSlash,
  Square as PhSquare,
  SquaresFour as PhSquaresFour,
  Stack as PhStack,
  SteeringWheel as PhSteeringWheel,
  Stop as PhStop,
  Sun as PhSun,
  TerminalWindow as PhTerminalWindow,
  TextAa as PhTextAa,
  Trash as PhTrash,
  TreeStructure as PhTreeStructure,
  UploadSimple as PhUploadSimple,
  Users as PhUsers,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  Waveform as PhWaveform,
  Wrench as PhWrench,
  X as PhX
} from '@phosphor-icons/react'
import { createElement, forwardRef, type FunctionComponent } from 'react'

/** The weight every icon draws with unless a call site or a `*Filled` alias says otherwise. */
export const ICON_WEIGHT: IconWeight = 'bold'

function icon(Base: Icon, displayName: string, weight: IconWeight = ICON_WEIGHT): Icon {
  const AppIcon = forwardRef<SVGSVGElement, IconProps>((props, ref) =>
    createElement(Base, { size: 24, weight, ...props, ref })
  )

  AppIcon.displayName = displayName

  return AppIcon
}

export const Activity = icon(PhPulse, 'Activity')
export const AlertCircle = icon(PhWarningCircle, 'AlertCircle')
export const AlertTriangle = icon(PhWarning, 'AlertTriangle')
export const AppWindow = icon(PhAppWindow, 'AppWindow')
export const Archive = icon(PhArchive, 'Archive')
export const ArchiveOff = icon(PhBoxArrowUp, 'ArchiveOff')
export const ArrowBarToDown = icon(PhArrowLineDown, 'ArrowBarToDown')
export const ArrowBarToUp = icon(PhArrowLineUp, 'ArrowBarToUp')
export const ArrowUp = icon(PhArrowUp, 'ArrowUp')
export const ArrowUpRight = icon(PhArrowUpRight, 'ArrowUpRight')
export const AtSign = icon(PhAt, 'AtSign')
export const AudioLines = icon(PhWaveform, 'AudioLines')
export const BarChart3 = icon(PhChartBar, 'BarChart3')
export const Bell = icon(PhBell, 'Bell')
export const Book = icon(PhBook, 'Book')
export const Bookmark = icon(PhBookmarkSimple, 'Bookmark')
export const BookmarkFilled = icon(PhBookmarkSimple, 'BookmarkFilled', 'fill')
export const Box = icon(PhCube, 'Box')
export const Brain = icon(PhBrain, 'Brain')
export const Bug = icon(PhBug, 'Bug')
export const Category = icon(PhShapes, 'Category')
export const Check = icon(PhCheck, 'Check')
export const CheckCircle2 = icon(PhCheckCircle, 'CheckCircle2')
export const CheckIcon = icon(PhCheck, 'CheckIcon')
export const ChevronDown = icon(PhCaretDown, 'ChevronDown')
export const ChevronDownIcon = icon(PhCaretDown, 'ChevronDownIcon')
export const ChevronLeft = icon(PhCaretLeft, 'ChevronLeft')
export const ChevronLeftIcon = icon(PhCaretLeft, 'ChevronLeftIcon')
export const ChevronRight = icon(PhCaretRight, 'ChevronRight')
export const ChevronRightIcon = icon(PhCaretRight, 'ChevronRightIcon')
export const ChevronUp = icon(PhCaretUp, 'ChevronUp')
export const CircleIcon = icon(PhCircle, 'CircleIcon')
export const CircleLetterA = icon(PhTextAa, 'CircleLetterA')
export const Clipboard = icon(PhClipboard, 'Clipboard')
export const Clock = icon(PhClock, 'Clock')
export const Cloud = icon(PhCloud, 'Cloud')
export const CloudUpload = icon(PhCloudArrowUp, 'CloudUpload')
export const Command = icon(PhCommand, 'Command')
export const Copy = icon(PhCopy, 'Copy')
export const CopyIcon = icon(PhCopy, 'CopyIcon')
export const CornerDownLeft = icon(PhArrowBendDownLeft, 'CornerDownLeft')
export const Cpu = icon(PhCpu, 'Cpu')
export const CreditCard = icon(PhCreditCard, 'CreditCard')
export const Database = icon(PhDatabase, 'Database')
export const Download = icon(PhDownloadSimple, 'Download')
export const Ear = icon(PhEar, 'Ear')
export const EarOff = icon(PhEarSlash, 'EarOff')
export const Egg = icon(PhEgg, 'Egg')
export const Eject = icon(PhEject, 'Eject', 'fill')
export const ExternalLink = icon(PhArrowSquareOut, 'ExternalLink')
export const Eye = icon(PhEye, 'Eye')
export const EyeOff = icon(PhEyeSlash, 'EyeOff')
export const FileImage = icon(PhImage, 'FileImage')
export const FileText = icon(PhFileText, 'FileText')
export const Filter = icon(PhFunnel, 'Filter')
export const FolderOpen = icon(PhFolderOpen, 'FolderOpen')
export const GitBranch = icon(PhGitBranch, 'GitBranch')
export const GitBranchIcon = icon(PhGitBranch, 'GitBranchIcon')
export const GitFork = icon(PhGitFork, 'GitFork')
export const GitForkIcon = icon(PhGitFork, 'GitForkIcon')
export const Globe = icon(PhGlobe, 'Globe')
export const Hash = icon(PhHash, 'Hash')
export const HelpCircle = icon(PhQuestion, 'HelpCircle')
export const ImageIcon = icon(PhImage, 'ImageIcon')
export const Info = icon(PhInfo, 'Info')
export const KeyRound = icon(PhKey, 'KeyRound')
export const Keyboard = icon(PhKeyboard, 'Keyboard')
export const Layers3 = icon(PhStack, 'Layers3')
export const LayoutDashboard = icon(PhSquaresFour, 'LayoutDashboard')
export const Link = icon(PhLink, 'Link')
export const Link2 = icon(PhLink, 'Link2')
export const LinkIcon = icon(PhLink, 'LinkIcon')
export const Loader2 = icon(PhCircleNotch, 'Loader2')
export const Loader2Icon = icon(PhCircleNotch, 'Loader2Icon')
export const Lock = icon(PhLock, 'Lock')
export const LockOpen = icon(PhLockOpen, 'LockOpen')
export const LogIn = icon(PhSignIn, 'LogIn')
export const Mail = icon(PhEnvelope, 'Mail')
export const Maximize = icon(PhCornersOut, 'Maximize')
export const MessageCircle = icon(PhChatCircle, 'MessageCircle')
export const MessageCode = icon(PhChatCenteredText, 'MessageCode')
export const MessageQuestion = icon(PhChatCircleDots, 'MessageQuestion')
export const MessageSquareText = icon(PhChatText, 'MessageSquareText')
export const Mic = icon(PhMicrophone, 'Mic')
export const MicOff = icon(PhMicrophoneSlash, 'MicOff')
export const Monitor = icon(PhDesktop, 'Monitor')
export const MonitorPlay = icon(PhMonitorPlay, 'MonitorPlay')
export const Moon = icon(PhMoon, 'Moon')
export const MoreHorizontal = icon(PhDotsThree, 'MoreHorizontal')
export const MoreHorizontalIcon = icon(PhDotsThree, 'MoreHorizontalIcon')
export const MoreVertical = icon(PhDotsThreeVertical, 'MoreVertical')
export const Network = icon(PhTreeStructure, 'Network')
export const NotebookTabs = icon(PhNotebook, 'NotebookTabs')
export const Package = icon(PhPackage, 'Package')
export const Palette = icon(PhPalette, 'Palette')
export const PanelBottom = icon(PhRows, 'PanelBottom')
export const PanelLeftIcon = icon(PhSidebar, 'PanelLeftIcon')
export const PanelTop = icon(PhBrowser, 'PanelTop')
export const Pause = icon(PhPause, 'Pause')
export const PawPrint = icon(PhPawPrint, 'PawPrint')
export const Pencil = icon(PhPencilSimple, 'Pencil')
export const PencilIcon = icon(PhPencilSimple, 'PencilIcon')
export const PencilLine = icon(PhPencilSimpleLine, 'PencilLine')
export const Pin = icon(PhPushPin, 'Pin')
export const Play = icon(PhPlay, 'Play')
export const Plug = icon(PhPlug, 'Plug')
export const Plus = icon(PhPlus, 'Plus')
export const Power = icon(PhPower, 'Power')
export const Puzzle = icon(PhPuzzlePiece, 'Puzzle')
export const QrCode = icon(PhQrCode, 'QrCode')
export const RefreshCw = icon(PhArrowsClockwise, 'RefreshCw')
export const RefreshCwIcon = icon(PhArrowsClockwise, 'RefreshCwIcon')
export const Save = icon(PhFloppyDisk, 'Save')
export const SealCheck = icon(PhSealCheck, 'SealCheck')
export const Search = icon(PhMagnifyingGlass, 'Search')
export const SearchIcon = icon(PhMagnifyingGlass, 'SearchIcon')
export const Send = icon(PhPaperPlaneRight, 'Send')
export const Settings = icon(PhGear, 'Settings')
export const Settings2 = icon(PhGearSix, 'Settings2')
export const ShieldLock = icon(PhShieldCheck, 'ShieldLock')
export const SlackLogo = icon(PhSlackLogo, 'SlackLogo')
export const SlidersHorizontal = icon(PhSlidersHorizontal, 'SlidersHorizontal')
export const SmilePlusIcon = icon(PhSmileyWink, 'SmilePlusIcon')
export const Square = icon(PhSquare, 'Square')
export const Starmap = icon(PhGraph, 'Starmap')
export const SteeringWheel = icon(PhSteeringWheel, 'SteeringWheel')
export const StopFilled = icon(PhStop, 'StopFilled', 'fill')
export const Sun = icon(PhSun, 'Sun')
export const Terminal = icon(PhTerminalWindow, 'Terminal')
export const Trash2 = icon(PhTrash, 'Trash2')
export const Upload = icon(PhUploadSimple, 'Upload')
export const Users = icon(PhUsers, 'Users')
export const Volume2 = icon(PhSpeakerHigh, 'Volume2')
export const Volume2Icon = icon(PhSpeakerHigh, 'Volume2Icon')
export const VolumeX = icon(PhSpeakerSlash, 'VolumeX')
export const VolumeXIcon = icon(PhSpeakerSlash, 'VolumeXIcon')
export const Wrench = icon(PhWrench, 'Wrench')
export const X = icon(PhX, 'X')
export const XIcon = icon(PhX, 'XIcon')
export const Zap = icon(PhLightning, 'Zap')
export const ZapFilled = icon(PhLightning, 'ZapFilled', 'fill')
export const ZoomIn = icon(PhMagnifyingGlassPlus, 'ZoomIn')
export const ZoomOut = icon(PhMagnifyingGlassMinus, 'ZoomOut')

/** What icon-taking props accept: any of the icons above, or a plain component of
 *  the same props (plugins pass their own). Same contract the Tabler type had. */
export type IconComponent = FunctionComponent<IconProps>
/**
 * Named icon-size scale — the single source of truth for SVG icon dimensions,
 * replacing ad-hoc `h-N w-N` / `size={N}`. Use `<Icon className={iconSize.sm} />`
 * (Tailwind `size-*` sets w+h and beats the icon's default 24px); compose with
 * `cn()` for colour/animation classes.
 */
export const iconSize = {
  xs: 'size-3', // 12px
  sm: 'size-3.5', // 14px
  md: 'size-4', // 16px
  lg: 'size-5', // 20px
  xl: 'size-6' // 24px
} as const

export type IconSize = keyof typeof iconSize
