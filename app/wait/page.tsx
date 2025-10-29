"use client";

export default function WaitPage() {
  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-[420px] mx-auto flex flex-col items-center justify-center p-6 gap-6 min-h-screen" style={{ backgroundColor: 'transparent' }}>
        <img
          src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/tunggu.png"
          alt="Tunggu"
          className="w-auto h-auto max-w-full"
          style={{ transform: 'scale(0.6)' }}
          onError={(e) => {
            console.error("Error loading tunggu.png image");
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

