function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      {/* ส่วนหัวของแอป (มีโลโก้และชื่อแอป) */}
      <div className="text-center mb-10 flex flex-col items-center">
        {/* แท็กเรียกโลโก้: ใส่ความสูง h-24 (96px) และจัดกลาง mx-auto */}
        <img 
          src="/suadpalogo.svg"  /* เปลี่ยน suadpa-logo.png เป็นชื่อไฟล์โลโก้จริงของคุณครับ */
          alt="โลโก้สวดป่ะ SUADPA" 
          className="h-24 w-auto mx-auto mb-5 drop-shadow-sm" /* ใส่เงาเล็กน้อย */
        />
        
        {/* ชื่อแอปปรับขนาดลงเล็กน้อยเพื่อให้เข้ากับโลโก้ */}
        <h1 className="text-3xl font-bold text-blue-900 mb-1">สวดป่ะ</h1>
        <h2 className="text-base text-gray-500 tracking-widest">SUADPA</h2>
        <p className="text-xs text-gray-400 mt-2">จัดให้ครบ จบทุกงานบุญ</p>
      </div>

      {/* กล่องเนื้อหาหลัก */}
      <div className="bg-white p-6 rounded-2xl shadow-sm w-full max-w-md text-center">
        <p className="text-gray-600">
          ยินดีต้อนรับสู่แอปพลิเคชันสวดป่ะ<br/>
          (พื้นที่สำหรับวางเมนูและเพลย์ลิสต์ในอนาคต)
        </p>
      </div>

    </div>
  )
}

export default App