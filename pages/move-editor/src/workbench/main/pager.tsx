import { createSignal } from 'solid-js'
import { Tab } from '../tab/tab'
import { createStore } from 'solid-js/store'

export const defaultTab: Tab = { name: '主页', path: '/', persist: true }
const [ tab, selectTab ] = createSignal<Tab>(defaultTab)

export const [ tabs, setTabs ] = createStore([ defaultTab ])
export const useTab = () => [ tab, selectTab ] as const

export function to(path: string, navigate: Function) {
    const tab = tabs.find(t => t.path === path)
    if (!tab) {
        return
    }

    selectTab(tab)
    navigate(path)
}

export const addGraphPage = (name: string, path: string) => {
    let tab = tabs.find(t => t.name === name)
    if (!tab) {
        tab = { name, path }
        setTabs(
            [...tabs, tab]
        )
    }

    selectTab(tabs.find(t => t.name === name) as any)
}

export const clearGraphPage = () => {
    setTabs(
        [ defaultTab ]
    )
}

function closePage(n: string, navigate: Function) {
    const { name, persist } = tabs.find(t => t.name === n) ?? defaultTab
    if (persist) {
        return
    }

    setTabs(
        tabs.filter(t => t.name!== name)
    )

    if (tab().name === n) {
        const tabIndex = tabs.findIndex(t => t.name === n)
        const tab = tabIndex > 0 ? tabs[tabIndex - 1] : defaultTab
        selectTab(tab)
        to(tab.path, navigate)
    }
}

export function usePager() {
    return {
        open: addGraphPage,
        close: closePage,
        clear: clearGraphPage,
    }
}