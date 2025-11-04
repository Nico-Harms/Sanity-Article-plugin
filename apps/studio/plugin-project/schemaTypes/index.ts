import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'
import complexBlog from './complexBlog'
import {richTextModule, quoteModule, imageModule, codeModule} from './modules'

export const schemaTypes = [
  post,
  author,
  category,
  blockContent,
  complexBlog,
  richTextModule,
  quoteModule,
  imageModule,
  codeModule,
]
