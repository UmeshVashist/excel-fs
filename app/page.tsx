import { redirect } from "next/navigation"

export default async function RootPage(props: {
  searchParams?: Promise<any> | any
}) {
  const resolvedParams = props.searchParams instanceof Promise 
    ? await props.searchParams 
    : props.searchParams;

  const queryString = resolvedParams 
    ? new URLSearchParams(resolvedParams).toString() 
    : "";

  redirect(`/dashboard${queryString ? `?${queryString}` : ""}`)
}
