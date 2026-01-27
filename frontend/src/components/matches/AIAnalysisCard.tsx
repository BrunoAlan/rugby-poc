import {
  Sparkles,
  AlertCircle,
  Clock,
  FileText,
  ThumbsUp,
  AlertTriangle,
  Star,
  Lightbulb,
} from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';
import type { Match } from '../../types';

interface AIAnalysisCardProps {
  match: Match;
}

// Map section titles to icons and colors
const sectionStyles: Record<
  string,
  {
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  'resumen general': {
    icon: <FileText className='h-4 w-4' />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  'puntos fuertes': {
    icon: <ThumbsUp className='h-4 w-4' />,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
  'areas a mejorar': {
    icon: <AlertTriangle className='h-4 w-4' />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  'jugadores destacados': {
    icon: <Star className='h-4 w-4' />,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  recomendaciones: {
    icon: <Lightbulb className='h-4 w-4' />,
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
};

function getSectionStyle(text: string) {
  const normalizedText = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  for (const [key, style] of Object.entries(sectionStyles)) {
    if (normalizedText.includes(key)) {
      return style;
    }
  }
  return {
    icon: <FileText className='h-4 w-4' />,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
  };
}

const markdownComponents: Components = {
  h2: ({ children }) => {
    const text = String(children);
    const style = getSectionStyle(text);
    return (
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${style.bgColor} ${style.borderColor} mt-8 mb-2 first:mt-0`}
      >
        <span className={style.textColor}>{style.icon}</span>
        <h3 className={`text-sm font-semibold ${style.textColor} m-0`}>
          {children}
        </h3>
      </div>
    );
  },
  p: ({ children }) => (
    <p className='text-sm text-gray-700 leading-relaxed mt-4 mb-4 px-2'>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className='mt-4 mb-6 space-y-2 px-2'>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className='mt-4 mb-6 space-y-2 px-2'>{children}</ol>
  ),
  li: ({ children }) => (
    <li className='text-sm text-gray-700 flex gap-3 leading-relaxed'>
      <span className='text-rugby-500 flex-shrink-0'>•</span>
      <span className='flex-1'>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className='font-semibold text-gray-900'>{children}</strong>
  ),
};

export default function AIAnalysisCard({ match }: AIAnalysisCardProps) {
  // Don't render if there's no analysis and no error
  if (!match.ai_analysis && !match.ai_analysis_error) {
    return null;
  }

  const generatedAt = match.ai_analysis_generated_at
    ? new Date(match.ai_analysis_generated_at).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className='card'>
      <div className='flex items-center justify-between mb-4 pb-4 border-b border-gray-100'>
        <div className='flex items-center gap-2'>
          <div className='p-2 bg-purple-100 rounded-lg'>
            <Sparkles className='h-5 w-5 text-purple-600' />
          </div>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Analisis del Partido
            </h2>
            <span className='inline-flex items-center text-xs text-purple-600 font-medium'>
              Powered by AI
            </span>
          </div>
        </div>
        {generatedAt && (
          <span className='flex items-center gap-1 text-xs text-gray-400'>
            <Clock className='h-3 w-3' />
            {generatedAt}
          </span>
        )}
      </div>

      {match.ai_analysis_error ? (
        <div className='flex items-start gap-3 rounded-lg bg-red-50 p-4'>
          <AlertCircle className='h-5 w-5 text-red-500 flex-shrink-0 mt-0.5' />
          <div>
            <p className='text-sm font-medium text-red-800'>
              Error al generar analisis
            </p>
            <p className='text-sm text-red-700 mt-1'>
              {match.ai_analysis_error}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <ReactMarkdown components={markdownComponents}>
            {match.ai_analysis || ''}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
