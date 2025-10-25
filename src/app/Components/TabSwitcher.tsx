"use client";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showCountOnActive?: boolean;
}

export default function TabSwitcher({
  tabs,
  activeTab,
  onTabChange,
  showCountOnActive = true,
}: TabSwitcherProps) {
  return (
    <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 rounded-lg text-[14px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
            activeTab === tab.id
              ? "bg-[#2E3B8E] text-white shadow-md"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined &&
            (showCountOnActive
              ? activeTab === tab.id
              : activeTab !== tab.id) && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] bg-yellow-400 text-gray-800 rounded-full font-bold">
                {tab.count}
              </span>
            )}
        </button>
      ))}
    </div>
  );
}
