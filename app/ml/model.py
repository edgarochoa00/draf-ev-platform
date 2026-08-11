import math

def poisson_pmf(k: int, lambd: float) -> float:
    """Calcula la masa de probabilidad de Poisson para k goles con media lambda"""
    if lambd <= 0:
        return 0.0
    return (math.pow(lambd, k) * math.exp(-lambd)) / math.factorial(k)

def dixon_coles_tau(x: int, y: int, home_rate: float, away_rate: float, rho: float) -> float:
    """
    Modificación de Dixon & Coles (1997) para corregir la dependencia estocástica
    en marcadores bajos (0-0, 1-0, 0-1, 1-1).
    """
    if x == 0 and y == 0:
        return max(0.0, 1.0 - (home_rate * away_rate * rho))
    elif x == 0 and y == 1:
        return max(0.0, 1.0 + (home_rate * rho))
    elif x == 1 and y == 0:
        return max(0.0, 1.0 + (away_rate * rho))
    elif x == 1 and y == 1:
        return max(0.0, 1.0 - rho)
    else:
        return 1.0

class PoissonBettingModel:
    """
    Modelo Cuantitativo de Distribución de Poisson con Corrección Dixon-Coles (1997)
    Calcula probabilidades verdaderas ajustadas por dependencia mutua en empates y bajos marcadores.
    """
    
    def __init__(self, max_goals: int = 6):
        self.max_goals = max_goals

    def compute_match_probabilities(self, home_lambda: float = 1.65, away_lambda: float = 1.25, rho: float = -0.13):
        """
        Genera la matriz de probabilidades 6x6 aplicando la corrección de Dixon-Coles.
        """
        matrix = []
        total_sum = 0.0
        
        for i in range(self.max_goals):
            row = []
            for j in range(self.max_goals):
                p_i = poisson_pmf(i, home_lambda)
                p_j = poisson_pmf(j, away_lambda)
                tau = dixon_coles_tau(i, j, home_lambda, away_lambda, rho)
                prob = p_i * p_j * tau
                row.append(prob)
                total_sum += prob
            matrix.append(row)

        # Normalización de matriz
        if total_sum > 0:
            for i in range(self.max_goals):
                for j in range(self.max_goals):
                    matrix[i][j] /= total_sum

        home_win_prob = 0.0
        draw_prob = 0.0
        away_win_prob = 0.0
        over_25_prob = 0.0
        under_25_prob = 0.0
        btts_yes_prob = 0.0
        btts_no_prob = 0.0

        for i in range(self.max_goals):
            for j in range(self.max_goals):
                prob = matrix[i][j]
                
                # 1X2 Probabilities
                if i > j:
                    home_win_prob += prob
                elif i == j:
                    draw_prob += prob
                else:
                    away_win_prob += prob
                
                # Over/Under 2.5
                if (i + j) > 2.5:
                    over_25_prob += prob
                else:
                    under_25_prob += prob
                
                # BTTS (Both Teams To Score)
                if i > 0 and j > 0:
                    btts_yes_prob += prob
                else:
                    btts_no_prob += prob

        return {
            "home_win": round(home_win_prob, 4),
            "draw": round(draw_prob, 4),
            "away_win": round(away_win_prob, 4),
            "over_25": round(over_25_prob, 4),
            "under_25": round(under_25_prob, 4),
            "btts_yes": round(btts_yes_prob, 4),
            "btts_no": round(btts_no_prob, 4)
        }

model_engine = PoissonBettingModel()

