"use client"
import Link, { LinkProps, useLinkStatus } from "next/link"
import { cn } from "../utils/cn.util"

export default function Linker(props: LinkProps<any> & { children: React.ReactNode }) {

    const { pending } = useLinkStatus()
    return (
        <Link {...props}>
            <div className={cn(pending && "animate-pulse")}>
                {props.children}
            </div>
        </Link>
    )
}
