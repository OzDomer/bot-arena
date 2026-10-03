export type Theme = {
    floorSafe: string; floorStorm: string; floorLine: string
    ring: string; stormText: string
    shipStroke: string
    label: string; outline: string; hit: string
    barBg: string; barEmpty: string
}

export const LIGHT: Theme = {
    floorSafe: '#ccc',
    floorStorm: '#8a8ad0',
    floorLine: '#999',
    ring: '#4040c0',
    stormText: '#7070ff',
    shipStroke: '#333',
    label: '#fff',
    outline: '#000',
    hit: '#ff3b3b',
    barBg: '#111',
    barEmpty: '#333'
}   // today's values
export const DARK: Theme = {
    floorSafe: '#2a2a30',
    floorStorm: '#2f2f5a',
    floorLine: '#3a3a40',
    ring: '#7070ff',
    stormText: '#9090ff',
    shipStroke: '#111',
    label: '#eee',
    outline: '#000',
    hit: '#ff5050',
    barBg: '#000',
    barEmpty: '#444'
}