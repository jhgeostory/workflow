import { ExternalLink } from 'lucide-react';

export function G2BWidget() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    G2B 발주 모니터링
                </h3>
                <a
                    href="https://g2b-vert.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                    페이지로 이동 <ExternalLink size={12} />
                </a>
            </div>
            <div className="flex-1 relative bg-slate-100">
                <iframe
                    src="https://g2b-vert.vercel.app/"
                    className="absolute inset-0 w-full h-full border-0"
                    title="G2B Dashboard"
                />
            </div>
        </div>
    );
}
