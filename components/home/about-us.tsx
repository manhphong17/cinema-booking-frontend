export function AboutUs() {
  return (
    <section id="about-us" className="py-24 relative overflow-hidden">
      {/* Background decoration (softer to avoid text washout) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Text Content - 60% */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 text-balance">
                Giới thiệu rạp của chúng tôi
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
            </div>
            
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p className="text-lg">
                Chào mừng bạn đến với <strong className="text-foreground font-semibold">Cinema</strong> - rạp chiếu phim địa phương
                mang đến trải nghiệm điện ảnh chất lượng cao ngay tại thành phố của bạn.
              </p>
              <p>
                Rạp sở hữu phòng chiếu hiện đại với công nghệ âm thanh Dolby Atmos, màn hình chuẩn và ghế ngồi cao cấp
                mang lại sự thoải mái tối đa cho khán giả.
              </p>
              <p>
                Với đội ngũ nhân viên chuyên nghiệp, nhiệt tình và cam kết về chất lượng dịch vụ, chúng tôi luôn đặt sự hài
                lòng của khách hàng lên hàng đầu và không ngừng cải tiến để mang đến những trải nghiệm xem phim tuyệt vời nhất.
              </p>
              <div className="bg-gradient-to-r from-primary/8 to-primary/4 p-5 rounded-xl border border-primary/15">
                <p className="font-semibold text-foreground text-lg">
                  Hãy đến với chúng tôi - nơi những câu chuyện điện ảnh trở nên sống động!
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-5 rounded-xl border bg-white/70 backdrop-blur hover:shadow-md transition">
                  <div className="text-xl font-bold text-primary mb-1">Dolby Atmos</div>
                  <div className="text-sm text-muted-foreground">Âm thanh đa chiều ấn tượng</div>
                </div>
                <div className="p-5 rounded-xl border bg-white/70 backdrop-blur hover:shadow-md transition">
                  <div className="text-xl font-bold text-primary mb-1">IMAX</div>
                  <div className="text-sm text-muted-foreground">Màn hình lớn, chân thực</div>
                </div>
                <div className="p-5 rounded-xl border bg-white/70 backdrop-blur hover:shadow-md transition">
                  <div className="text-xl font-bold text-primary mb-1">Ghế VIP</div>
                  <div className="text-sm text-muted-foreground">Thoải mái, rộng rãi</div>
                </div>
                <div className="p-5 rounded-xl border bg-white/70 backdrop-blur hover:shadow-md transition">
                  <div className="text-xl font-bold text-primary mb-1">Combo hấp dẫn</div>
                  <div className="text-sm text-muted-foreground">Bắp nước đa dạng, giá tốt</div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl font-bold text-primary">20+</div>
                  <div className="text-xs text-muted-foreground">Cụm rạp</div>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl font-bold text-primary">150+</div>
                  <div className="text-xs text-muted-foreground">Phòng chiếu</div>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl font-bold text-primary">10 năm</div>
                  <div className="text-xs text-muted-foreground">Kinh nghiệm</div>
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
