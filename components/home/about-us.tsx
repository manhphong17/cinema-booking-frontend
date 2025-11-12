export function AboutUs() {
    return (
        <section id="about-us" className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-slate-50">
            {/* Background decoration with modern gradient */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #ec4899 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>


            {/* Decorative Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500"></div>

            {/* Popcorn Images - Left Side */}
            <div className="hidden xl:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/4 z-0 opacity-30 hover:opacity-40 transition-opacity duration-300 pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&h=800&fit=crop&q=90"
                    alt="Popcorn"
                    className="w-80 h-96 object-contain rotate-12 transform drop-shadow-2xl brightness-110 contrast-110"
                    loading="lazy"
                    style={{ filter: 'brightness(1.1) contrast(1.15) saturate(1.1)' }}
                    onError={(e) => {
                        // Fallback nếu không load được ảnh
                        e.currentTarget.style.display = 'none'
                    }}
                />
            </div>

            {/* Popcorn Images - Right Side */}
            <div className="hidden xl:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 z-0 opacity-30 hover:opacity-40 transition-opacity duration-300 pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&h=800&fit=crop&q=90"
                    alt="Popcorn"
                    className="w-80 h-96 object-contain -rotate-12 transform drop-shadow-2xl brightness-110 contrast-110"
                    loading="lazy"
                    style={{ filter: 'brightness(1.1) contrast(1.15) saturate(1.1)' }}
                    onError={(e) => {
                        // Fallback nếu không load được ảnh
                        e.currentTarget.style.display = 'none'
                    }}
                />
            </div>

            {/* Decorative Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500"></div>

            <div className="container mx-auto px-4 relative z-10 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
                    {/* Text Content - 60% */}
                    <div className="lg:col-span-3">
                        <div className="mb-8 relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-pink-300 rounded-full"></div>
                            <div className="text-[11px] font-bold text-pink-600 uppercase tracking-wider mb-3 px-2 py-1 bg-pink-50 rounded-md inline-block">
                                About Us
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 text-balance">
                <span className="bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  Giới thiệu rạp của chúng tôi
                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></div>
                                <div className="h-1.5 w-2 rounded-full bg-pink-400"></div>
                            </div>
                        </div>

                        <div className="space-y-4 text-foreground/80 leading-relaxed">
                            <p className="text-lg">
                                Chào mừng bạn đến với <strong className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">Cinema</strong> - rạp chiếu phim hiện đại
                                mang đến trải nghiệm điện ảnh chất lượng cao ngay tại trung tâm thành phố.
                            </p>
                            <p>
                                Rạp sở hữu 4 phòng chiếu hiện đại với công nghệ âm thanh Dolby Atmos, màn hình 4K và ghế ngồi cao cấp
                                mang lại sự thoải mái tối đa cho khán giả.
                            </p>
                            <p>
                                Với đội ngũ nhân viên chuyên nghiệp, nhiệt tình và cam kết về chất lượng dịch vụ, chúng tôi luôn đặt sự hài
                                lòng của khách hàng lên hàng đầu và không ngừng cải tiến để mang đến những trải nghiệm xem phim tuyệt vời nhất.
                            </p>
                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                                <p className="font-bold text-gray-900 text-lg">
                                    Hãy đến với chúng tôi - nơi những câu chuyện điện ảnh trở nên sống động!
                                </p>
                            </div>

                            {/* Feature highlights */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-pink-300 hover:shadow-lg transition-all duration-300 group">
                                    <div className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">Dolby Atmos</div>
                                    <div className="text-sm text-slate-600">Âm thanh đa chiều ấn tượng</div>
                                </div>
                                <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-pink-300 hover:shadow-lg transition-all duration-300 group">
                                    <div className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">Màn hình 4K</div>
                                    <div className="text-sm text-slate-600">Hình ảnh sắc nét, chân thực</div>
                                </div>
                                <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-pink-300 hover:shadow-lg transition-all duration-300 group">
                                    <div className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">Ghế VIP</div>
                                    <div className="text-sm text-slate-600">Thoải mái, rộng rãi</div>
                                </div>
                                <div className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-pink-300 hover:shadow-lg transition-all duration-300 group">
                                    <div className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">Combo hấp dẫn</div>
                                    <div className="text-sm text-slate-600">Bắp nước đa dạng, giá tốt</div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Image - 40% */}
                    <div className="lg:col-span-2">
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl group border-4 border-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl -z-10 blur-xl group-hover:blur-2xl transition-all duration-700"></div>
                            <img
                                src="img.png"
                                alt="Cinema Interior"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}


