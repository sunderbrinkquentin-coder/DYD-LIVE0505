// src/components/cv-templates/ClassicTemplate.tsx

import React from 'react';
import { ClassicCVTemplate } from './templates/ClassicCVTemplate';

// Falls du starke Typisierung willst, kannst du das später noch typisieren.
// Fürs Funktionieren reicht "any" völlig aus.
export const ClassicTemplate: React.FC<any> = (props) => {
  return <ClassicCVTemplate {...props} />;
};

export default ClassicTemplate;
