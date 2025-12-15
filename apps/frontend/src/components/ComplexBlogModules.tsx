'use client';

import PortableTextRenderer from './PortableTextRenderer';

interface ComplexBlogModulesProps {
  modules: any[];
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
        const key = module._key || index;

        switch (module._type) {
          case 'richTextModule':
            return module.content ? (
              <div key={key}>
                <PortableTextRenderer content={module.content} />
              </div>
            ) : null;

          case 'quoteModule':
            return (
              <blockquote
                key={key}
                className="border-l-4 border-blue-500 pl-6 py-4 my-6 italic text-gray-700 bg-gray-50 rounded-r-lg"
              >
                <p className="text-lg mb-2">"{module.quote}"</p>
                {module.author && (
                  <p className="text-sm text-gray-600">— {module.author}</p>
                )}
              </blockquote>
            );

          case 'imageModule':
            return module.image?.asset?.url ? (
              <figure key={key} className="my-8">
                <img
                  src={module.image.asset.url}
                  alt={module.caption || 'Image'}
                  className="w-full rounded-lg"
                />
                {module.caption && (
                  <figcaption className="text-sm text-gray-500 mt-2 text-center">
                    {module.caption}
                  </figcaption>
                )}
              </figure>
            ) : null;

          case 'codeModule':
            return (
              <div key={key} className="my-6">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{module.code}</code>
                </pre>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
