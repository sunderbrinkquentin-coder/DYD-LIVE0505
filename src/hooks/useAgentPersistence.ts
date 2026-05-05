import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { dbService } from '../services/databaseService';
import { agentSections } from '../config/agentFlow';

export function useAgentPersistence() {
  const { agentState } = useStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log('[useAgentPersistence] State changed, scheduling save in 1 second...', {
      section: agentState.currentSection,
      question: agentState.currentQuestion,
      answersCount: Object.keys(agentState.answers).length,
      entriesCount: Object.keys(agentState.entries).length
    });

    saveTimeoutRef.current = setTimeout(() => {
      console.log('[useAgentPersistence] Executing auto-save...');
      saveProgress();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [agentState.currentSection, agentState.currentQuestion, agentState.answers, agentState.entries]);

  const loadProgress = async () => {
    try {
      const progress = await dbService.getAgentProgress();
      if (progress) {
        const responses = await dbService.getAgentResponses();
        if (responses) {
          console.log('Loaded progress and responses from database');
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const saveProgress = async () => {
    try {
      const currentSectionConfig = agentSections[agentState.currentSection];
      if (!currentSectionConfig) {
        console.log('[useAgentPersistence] No section config found, skipping save');
        return;
      }

      console.log('[useAgentPersistence] Saving progress for section:', currentSectionConfig.id);

      await dbService.upsertAgentProgress({
        current_section_id: currentSectionConfig.id,
        current_section_index: agentState.currentSection,
        current_question_index: agentState.currentQuestion,
        completed_sections: agentState.completedSections,
      });

      console.log('[useAgentPersistence] Progress saved, now saving section responses...');
      await saveSectionResponses(currentSectionConfig.id);
      console.log('[useAgentPersistence] All data saved successfully!');
    } catch (error) {
      console.error('[useAgentPersistence] Failed to save progress:', error);
    }
  };

  const saveSectionResponses = async (sectionId: string) => {
    console.log('[useAgentPersistence] Saving to base_data for section:', sectionId);
    console.log('[useAgentPersistence] Current entries:', {
      bildung: agentState.entries.bildung,
      zertifikate: agentState.entries.zertifikate,
      berufserfahrung: agentState.entries.berufserfahrung,
      projekte: agentState.entries.projekte,
    });
    await saveToBaseData();
  };

  const saveToBaseData = async () => {
    try {
      const contactData = {
        vorname: agentState.answers.vorname,
        nachname: agentState.answers.nachname,
        email: agentState.answers.email,
        telefon: agentState.answers.telefon,
        ort: agentState.answers.ort,
        plz: agentState.answers.plz,
        linkedin: agentState.answers.linkedin,
        website: agentState.answers.website,
      };

      const hardSkills = agentState.answers.hard_skills || [];
      const softSkills = agentState.answers.soft_skills || [];
      const topSkills = agentState.answers.top_skills || [];

      const agentData = {
        contact: contactData,
        bildung: agentState.entries.bildung || [],
        berufserfahrung: agentState.entries.berufserfahrung || [],
        skills: {
          hard: hardSkills,
          soft: softSkills,
          top: topSkills,
        },
        projekte: agentState.entries.projekte || [],
        sprachen: agentState.answers.sprachen_list || [],
        zertifikate: agentState.entries.zertifikate || [],
        zusaetzlich: agentState.answers.zusaetzlich,
      };

      const hasAnyData = Object.values(contactData).some(v => v) ||
        agentData.bildung.length > 0 ||
        agentData.berufserfahrung.length > 0 ||
        hardSkills.length > 0 ||
        softSkills.length > 0 ||
        topSkills.length > 0 ||
        agentData.projekte.length > 0 ||
        agentData.sprachen.length > 0 ||
        agentData.zertifikate.length > 0 ||
        agentData.zusaetzlich;

      if (hasAnyData) {
        console.log('[useAgentPersistence] Saving agent data to base_data table...');
        await dbService.debouncedSaveAgentDataToBaseData(agentData);
        console.log('[useAgentPersistence] Agent data saved to base_data successfully!');
      } else {
        console.log('[useAgentPersistence] No data to save to base_data yet');
      }
    } catch (error) {
      console.error('[useAgentPersistence] Failed to save to base_data:', error);
    }
  };

  const markSectionCompleted = async (sectionId: string, responses: Record<string, any>) => {
    console.log('[useAgentPersistence] Section completed:', sectionId);
  };

  const markSectionSkipped = async (sectionId: string) => {
    console.log('[useAgentPersistence] Section skipped:', sectionId);
  };

  return {
    markSectionCompleted,
    markSectionSkipped,
  };
}
