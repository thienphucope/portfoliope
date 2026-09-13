import TextToSpeech from '@/features/texttospeech/TextToSpeech';
import theme from '@/features/caseArchive/styles/ArchiveTheme.module.css';
import WorkspaceHeader from '@/components/ui/WorkspaceHeader';

export const metadata = {
  title: 'Voice Synthesis',
  description: 'Speech synthesis using a fine-tuned GPT-SoVITS model of Moxxi\'s voice.',
};

export default function VoicePage() {
  return (
    <main className={`${theme.theme} voice-route`}>
      <WorkspaceHeader label="Text to speech" />
      <div className="voice-route-inner">
        <TextToSpeech />
      </div>
    </main>
  );
}
