export function AboutUs() {
  return (
    <section id="about-us" className="py-24 relative overflow-hidden">
      {/* Background decoration with modern gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Text Content - 60% */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 text-balance">
                Giới thiệu rạp của chúng tôi
              </h2>
              <div className="w-16 h-1 bg-black/80 rounded-full"></div>
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
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                <p className="font-semibold text-foreground text-lg">
                  Hãy đến với chúng tôi - nơi những câu chuyện điện ảnh trở nên sống động!
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-5 rounded-xl border bg-white hover:shadow-md transition">
                  <div className="text-xl font-bold text-foreground mb-1">Dolby Atmos</div>
                  <div className="text-sm text-slate-600">Âm thanh đa chiều ấn tượng</div>
                </div>
                <div className="p-5 rounded-xl border bg-white hover:shadow-md transition">
                  <div className="text-xl font-bold text-foreground mb-1">Màn hình 4K</div>
                  <div className="text-sm text-slate-600">Hình ảnh sắc nét, chân thực</div>
                </div>
                <div className="p-5 rounded-xl border bg-white hover:shadow-md transition">
                  <div className="text-xl font-bold text-foreground mb-1">Ghế VIP</div>
                  <div className="text-sm text-slate-600">Thoải mái, rộng rãi</div>
                </div>
                <div className="p-5 rounded-xl border bg-white hover:shadow-md transition">
                  <div className="text-xl font-bold text-foreground mb-1">Combo hấp dẫn</div>
                  <div className="text-sm text-slate-600">Bắp nước đa dạng, giá tốt</div>
                </div>
              </div>

            </div>
          </div>

          {/* Image - 40% */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src="/modern-cinema-theater-interior-luxury.jpg"
                alt="Cinema Interior"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
