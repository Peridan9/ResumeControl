export default function Profile() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <svg
            className="w-32 h-32 text-gray-400 dark:text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="9.13 22.54 5.29 22.54 5.29 6.25 5.29 1.46 9.13 1.46 9.13 22.54"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="1.92"
              fill="none"
            />
            <polygon
              points="1.46 6.25 22.54 6.25 22.54 5.29 9.13 1.46 5.29 1.46 1.46 5.29 1.46 6.25"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="1.92"
              fill="none"
            />
            <line
              x1="23.5"
              y1="22.54"
              x2="0.5"
              y2="22.54"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="1.92"
            />
            <path
              d="M20.62,6.25V9.64a1.82,1.82,0,0,0,.9,1.63A1.92,1.92,0,1,1,18.71,13"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="1.92"
              fill="none"
            />
            <line
              x1="9.13"
              y1="16.79"
              x2="5.29"
              y2="20.63"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="1.92"
            />
            <line
              x1="5.29"
              y1="12"
              x2="9.13"
              y2="15.83"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="1.92"
            />
            <line
              x1="9.13"
              y1="7.21"
              x2="5.29"
              y2="11.04"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="1.92"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Under Development
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This page is currently under development.
        </p>
      </div>
    </div>
  )
}

