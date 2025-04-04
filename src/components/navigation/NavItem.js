export default function NavItem({ icon, label, active }) {
  return (
    <li className={`mt-3 p-2 ${active 
      ? "text-blue-600 dark:text-blue-300" 
      : "hover:text-blue-600 dark-hover:text-blue-300"} rounded-lg`}>
      <a href="#" className="flex flex-col items-center">
        <svg className="fill-current h-5 w-5" viewBox="0 0 24 24">
          <path d={icon}></path>
        </svg>
        <span className="text-xs mt-2">{label}</span>
      </a>
    </li>
  );
}