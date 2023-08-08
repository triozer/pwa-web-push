import Link from "next/link"

const HiPage = () => {
  return (
    <>
      <h1 className="mb-6">Hi!</h1>
      <Link href="/">
        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Go back to home.
        </button>
      </Link>
    </>
  )
}

export default HiPage
