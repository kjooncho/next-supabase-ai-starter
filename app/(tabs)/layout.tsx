import TabBar from '@/components/ui/TabBar'

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto pt-[59px] pb-[80px]">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
