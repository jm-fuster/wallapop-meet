import * as React from "react"
import { DesignSystemDevLink } from "@/components/design-system/design-system-dev-link"
import { UnofficialConceptNotice } from "@/components/site/unofficial-concept-notice"
import { WallapopChatWorkspace } from "@/components/meetup/wallapop-chat-workspace"
import { DesignSystemPage } from "@/pages/design-system-page"
import { NAVIGATION_EVENT_NAME } from "@/lib/navigation"

function App() {
    const [pathname, setPathname] = React.useState(() => window.location.pathname)

    React.useEffect(() => {
        const syncPathname = () => setPathname(window.location.pathname)
        window.addEventListener("popstate", syncPathname)
        window.addEventListener(NAVIGATION_EVENT_NAME, syncPathname)
        return () => {
            window.removeEventListener("popstate", syncPathname)
            window.removeEventListener(NAVIGATION_EVENT_NAME, syncPathname)
        }
    }, [])

    return (
        <>
            <UnofficialConceptNotice />
            {pathname === "/design-system" ? <DesignSystemPage /> : <WallapopChatWorkspace />}
            <DesignSystemDevLink />
        </>
    )
}

export default App
