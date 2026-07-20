import { motion } from 'framer-motion';
import { FiExternalLink, FiRadio } from 'react-icons/fi';
import sourceReport from '../../scripts/source-report.json';

const actionsUrl = 'https://github.com/Kizitofahad-rgb/movie-zone/actions/workflows/test-sources.yml';

function getLastCheckedLabel(lastChecked) {
  if (!lastChecked) return 'Not checked yet';
  const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(lastChecked).getTime()) / 86_400_000));
  return `Last checked: ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
}

export default function SourceStatus() {
  const sources = sourceReport.sources ?? [];

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="glass rounded-2xl border border-white/10 p-5 mb-10">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-primary"><FiRadio /><h2 className="font-bold text-white">Video Source Monitor</h2></div>
          <p className="text-xs text-gray-500 mt-1">{getLastCheckedLabel(sourceReport.lastChecked)}</p>
        </div>
        <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href={actionsUrl} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black">
          Run Manual Check <FiExternalLink />
        </motion.a>
      </div>
      {sources.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">No source report is available yet.</p>
      ) : (
        <div className="overflow-x-auto hide-scrollbar"><div className="min-w-[420px]">
          <div className="grid grid-cols-[1fr_110px_120px] border-b border-white/10 px-3 py-2 text-xs text-gray-500"><span>Name</span><span>Status</span><span>Response time</span></div>
          {sources.map((source, index) => {
            const working = source.status === 'working';
            return <motion.div key={source.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="grid grid-cols-[1fr_110px_120px] items-center border-b border-white/5 px-3 py-3 text-sm last:border-0">
              <span className="font-medium text-white">{source.name}</span>
              <span className="flex items-center gap-2 capitalize text-gray-300"><span className={`h-2.5 w-2.5 rounded-full ${working ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />{source.status}</span>
              <span className="text-gray-400">{source.responseTime ?? '—'}{source.responseTime != null ? ' ms' : ''}</span>
            </motion.div>;
          })}
        </div></div>
      )}
    </motion.section>
  );
}
