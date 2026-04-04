/** Game session — expand with postMessage sandbox contract */
export type GameId = 'calm_circles'

export interface GameSession {
  gameId: GameId
  startedAt: number
}
