'use client';

import PortableTextRenderer from './PortableTextRenderer';
import type { ComplexBlogModule } from '@/lib/sanity';
import { urlFor } from '@/lib/sanity';

interface ComplexBlogModulesProps {
  modules: ComplexBlogModule[];
}

export default function ComplexBlogModules({
  modules,
}: ComplexBlogModulesProps) {
  if (!modules || modules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {modules.map((module, index) => {
        switch (module._type) {
          case 'richTextModule':
            return module.content ? (
              <div key={module._key || index}>
                <PortableTextRenderer content={module.content} />
              </div>
            ) : null;

          case 'quoteModule':
            return (
              <blockquote
                key={module._key || index}
                className="border-l-4 border-blue-500 pl-6 py-4 my-6 italic text-gray-700 bg-gray-50 rounded-r-lg"
              >
                <p className="text-lg mb-2">"{module.quote}"</p>
                {module.author && (
                  <p className="text-sm text-gray-600">— {module.author}</p>
                )}
              </blockquote>
            );

          case 'imageModule': {
            if (!module.image?.asset) return null;
            const imageUrl = urlFor(module.image).width(1200).url();
            return (
              <figure key={module._key || index} className="my-8">
                <img
                  src={imageUrl}
                  alt={module.caption || 'Image'}
                  className="w-full rounded-lg"
                />
                {module.caption && (
                  <figcaption className="text-sm text-gray-500 mt-2 text-center">
                    {module.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'codeModule':
            return (
              <div key={module._key || index} className="my-6">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code className={`language-${module.language || 'text'}`}>
                    {module.code}
                  </code>
                </pre>
                {module.language && (
                  <p className="text-xs text-gray-500 mt-1">
                    Language: {module.language}
                  </p>
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

