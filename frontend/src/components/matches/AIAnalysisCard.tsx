import {
  Sparkles,
  AlertCircle,
  Clock,
  FileText,
  ThumbsUp,
  AlertTriangle,
  Star,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';
import type { Match } from '../../types';

interface AIAnalysisCardProps {
  match: Match;
}

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
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
  },
  'puntos fuertes': {
    icon: <ThumbsUp className='h-4 w-4' />,
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
  },
  'areas a mejorar': {
    icon: <AlertTriangle className='h-4 w-4' />,
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
  },
  'jugadores destacados': {
    icon: <Star className='h-4 w-4' />,
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
  },
  recomendaciones: {
    icon: <Lightbulb className='h-4 w-4' />,
    bgColor: 'bg-cyan-900/20',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
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
    bgColor: 'bg-dark-700/50',
    borderColor: 'border-dark-600',
    textColor: 'text-dark-300',
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
    <p className='text-sm text-gray-300 leading-relaxed mt-4 mb-4 px-2'>
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
    <li className='text-sm text-gray-300 flex gap-3 leading-relaxed'>
      <span className='text-primary-500 flex-shrink-0'>•</span>
      <span className='flex-1'>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className='font-semibold text-white'>{children}</strong>
  ),
};

export default function AIAnalysisCard({ match }: AIAnalysisCardProps) {
  const isLoading = match.ai_analysis_status === 'pending' || match.ai_analysis_status === 'processing';

  if (isLoading) {
    return (
      <div className='card border-t-2 border-purple-500'>
        <div className='flex items-center justify-between mb-4 pb-4 border-b border-dark-700/50'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-purple-500/20 rounded-lg'>
              <Sparkles className='h-5 w-5 text-purple-400' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-white'>
                Analisis del Partido
              </h2>
              <span className='inline-flex items-center text-xs text-purple-400 font-medium'>
                Powered by AI
              </span>
            </div>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center py-12 gap-4'>
          <Loader2 className='h-8 w-8 animate-spin text-purple-400' />
          <div className='text-center'>
            <p className='text-sm font-medium text-gray-300'>
              {match.ai_analysis_status === 'pending' ? 'En cola para generacion...' : 'Generando analisis...'}
            </p>
            <p className='text-xs text-dark-400 mt-1'>
              Esto puede demorar unos segundos
            </p>
          </div>
        </div>
      </div>
    );
  }

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
    <div className='card border-t-2 border-purple-500'>
      <div className='flex items-center justify-between mb-4 pb-4 border-b border-dark-700/50'>
        <div className='flex items-center gap-2'>
          <div className='p-2 bg-purple-500/20 rounded-lg'>
            <Sparkles className='h-5 w-5 text-purple-400' />
          </div>
          <div>
            <h2 className='text-lg font-semibold text-white'>
              Analisis del Partido
            </h2>
            <span className='inline-flex items-center text-xs text-purple-400 font-medium'>
              Powered by AI
            </span>
          </div>
        </div>
        {generatedAt && (
          <span className='flex items-center gap-1 text-xs text-dark-400'>
            <Clock className='h-3 w-3' />
            {generatedAt}
          </span>
        )}
      </div>

      {match.ai_analysis_error ? (
        <div className='flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-4'>
          <AlertCircle className='h-5 w-5 text-red-400 flex-shrink-0 mt-0.5' />
          <div>
            <p className='text-sm font-medium text-red-400'>
              Error al generar analisis
            </p>
            <p className='text-sm text-red-400/80 mt-1'>
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
