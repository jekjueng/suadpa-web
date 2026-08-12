function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      {/* ส่วนหัวของแอป */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">สวดป่ะ</h1>
        <h2 className="text-lg text-gray-500 tracking-widest">SUADPA</h2>
        <p className="text-sm text-gray-400 mt-2">จัดให้ครบ จบทุกงานบุญ</p>
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