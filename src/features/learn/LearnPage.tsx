import { Syllabus } from '../../ui/Syllabus';

export function LearnPage() {
  return (
    <div>
      <div className="page-head">
        <h1>Topics</h1>
      </div>
      <Syllabus detailed />
    </div>
  );
}
