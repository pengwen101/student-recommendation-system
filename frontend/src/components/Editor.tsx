import { memo, useEffect, useRef } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import EDITOR_JS_TOOLS from './Tool.tsx';

// 1. Define an interface for your props
interface EditorProps {
  data: OutputData | undefined;
  onChange: (data: OutputData) => void;
  editorBlock: string;
}

const Editor = ({ data, onChange, editorBlock }: EditorProps) => {
  // 2. Add the EditorJS type to the useRef hook and initialize it with null
  const ref = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: editorBlock,
        data: data,
        tools: EDITOR_JS_TOOLS,
        // 3. Remove the unused 'event' parameter
        async onChange(api) {
          const savedData = await api.saver.save();
          onChange(savedData);
        },
      });
      ref.current = editor;
    }

    return () => {
      // 4. ref.current is now correctly typed, so TypeScript knows 'destroy' exists
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
        ref.current = null; // Good practice to clean up the ref
      }
    };
  }, []); // Keeping the empty dependency array so the editor only initializes once

  return <div id={editorBlock} />;
};

export default memo(Editor);