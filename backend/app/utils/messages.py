from datetime import datetime

def apologize():
    today = datetime.now()
    month = today.month

    if month in [12, 1, 2]:
        season = "mùa đông"
    elif month in [3, 4, 5]:
        season = "mùa xuân"
    elif month in [6, 7, 8]:
        season = "mùa hè"
    else:
        season = "mùa thu"
    messages = {
        "mùa đông": "Mình đang hơi bị đông cứng vì mùa đông 🥶❄️, bạn thử lại sau nhe!",
        "mùa xuân": "Mình đang hoa mắt vì mùa xuân tràn về 🌸😅, bạn thử lại một chút nha!",
        "mùa hè": "Mình đang nóng bốc hơi vì mùa hè ☀️😵, bạn thử lại sau một tí nhe!",
        "mùa thu": "Mình đang rối nhẹ vì lá thu rơi 🍂😳, bạn thử lại sau nhe!"
    }


    return messages[season]
