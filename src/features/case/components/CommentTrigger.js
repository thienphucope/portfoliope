import React from 'react';
import { Pencil } from 'lucide-react';

export default function CommentTrigger({ onClick }) {
  return (
    <div
      className="comment-trigger"
      onClick={onClick}
      title="Add comment"
      style={{
        position: 'absolute', bottom: '30px', right: '30px',
        width: '60px', height: '60px', borderRadius: '50%',
        backgroundColor: 'var(--colorone)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 200,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', color: 'black',
      }}
    >
      <Pencil size={28} />
    </div>
  );
}