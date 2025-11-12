import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ContactCardProps {
    Icon: LucideIcon;
    title: string;
    content: string;
    linkHref?: string;
    linkText?: string;
    subContent?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
                                                     Icon,
                                                     title,
                                                     content,
                                                     linkHref,
                                                     linkText,
                                                     subContent
                                                 }) => {
    return (
        // Áp dụng nền đen bóng, chữ trắng
        <div className="p-5 rounded-xl text-white
            bg-gray-900
            shadow-2xl shadow-black/80
            ring-1 ring-white/10
            bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950
            transition-all duration-300 hover:shadow-pink-500/30">
            <div className="flex items-start gap-4">
                {/* Giữ nguyên màu icon hồng để tạo điểm nhấn */}
                <Icon className="h-6 w-6 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                    {/* Tiêu đề màu trắng */}
                    <p className="text-lg font-bold text-white mb-0.5">{title}</p>
                    {/* Nội dung màu trắng hơi nhạt */}
                    <p className="text-base font-medium text-gray-200">{content}</p>

                    {/* Link */}
                    {linkHref && (
                        <a
                            href={linkHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-1 inline-block"
                        >
                            {linkText || 'Chi tiết'}
                        </a>
                    )}

                    {/* Nội dung phụ */}
                    {subContent && (
                        <p className="text-xs text-slate-400 mt-1">{subContent}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactCard;