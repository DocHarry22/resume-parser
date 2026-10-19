'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { StudioPreview } from '@/components/resumeio/StudioPreview';
import { DEFAULT_DESIGN } from '@/components/resumeio/resumeDocument';
import { gallerySample } from './TemplateGallery';

const examples = [
  { role: 'Project Coordinator', summary: 'Organized project coordinator who brings people, schedules and priorities together. Clear communicator with experience keeping teams informed and projects on track.', template: 'modern' as const },
  { role: 'Teacher', summary: 'Thoughtful educator focused on creating a supportive classroom. Experienced in lesson planning, communicating with families and helping learners build confidence.', template: 'classic' as const },
  { role: 'Civil Engineer', summary: 'Detail-oriented engineer with a practical approach to planning and problem solving. Experienced in project documentation, teamwork and coordinating technical information.', template: 'professional' as const },
  { role: 'Accountant', summary: 'Methodical accounting professional who values accurate records and clear reporting. Comfortable organizing financial information and working to deadlines.', template: 'minimal' as const },
  { role: 'Graduate', summary: 'Curious recent graduate ready to put learning into practice. Brings a collaborative mindset, thoughtful research and a commitment to developing professional skills.', template: 'creative' as const },
  { role: 'Administrator', summary: 'Reliable administrator who keeps the details organized. Experienced in managing schedules, preparing documents and supporting a team with clear communication.', template: 'elegant' as const },
];

export default function HomepageExamples() {
  const [index, setIndex] = useState(0);
  const example = examples[index];
  const sample = { ...gallerySample, summary: { summary: example.summary }, experience: [{ ...gallerySample.experience[0], position: example.role, description: ['Describe your own responsibilities and the contribution you made.', 'Add a relevant example that shows how you work.'] }] };
  return <section className="home-examples" id="resume-examples"><div className="cf-container home-examples-inner"><div className="home-examples-copy"><p className="cf-eyebrow">A little inspiration goes a long way</p><h2>Find the words<br />for your next chapter.</h2><p>Explore a few illustrative starting points. Your strongest resume is the one that tells your own story.</p><div className="home-role-options" aria-label="Choose a resume example">{examples.map((item, i) => <button key={item.role} aria-pressed={index === i} onClick={() => setIndex(i)}>{item.role}{i === index && <Check size={15} />}</button>)}</div><Link className="home-text-link" href={`/builder?template=${example.template}`}>Start with this design <ArrowRight size={18} /></Link><span className="home-example-disclaimer">Examples are fictional. New documents start blank.</span></div><div className="home-example-preview" aria-label={`${example.role} illustrative resume preview`}><div className="home-example-paper" aria-hidden="true"><StudioPreview resume={sample} template={example.template} colorTheme="blue" design={DEFAULT_DESIGN} scale={0.48} /></div><span className="home-example-label"><Check size={16} />Your experience. A clear first impression.</span></div></div></section>;
}
