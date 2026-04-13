import React from 'react';
import BaseStyles from './BaseStyles';
import StickySpineStyles from './StickySpineStyles';
import TabPanelStyles from './TabPanelStyles';
import ChatStyles from './ChatStyles';
import PDFStyles from './PDFStyles';
import EditorStyles from './EditorStyles';
import MarkdownStyles from './MarkdownStyles';
import PromptStyles from './PromptStyles';
import MobileStyles from './MobileStyles';
import FunctionBallStyles from './FunctionBallStyles';

/**
 * Aggregator component for the case vault UI styles.
 * Imports and renders specialized style components for each UI section.
 */
export default function VaultStyles() {
  return (
    <>
      <BaseStyles />
      <StickySpineStyles />
      <TabPanelStyles />
      <ChatStyles />
      <PDFStyles />
      <EditorStyles />
      <MarkdownStyles />
      <PromptStyles />
      <MobileStyles />
      <FunctionBallStyles />
    </>
  );
}
