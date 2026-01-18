// Emoji Picker Component - Available globally as EmojiPicker

const EmojiPicker = {
    // Popular emoji categories with searchable emojis
    emojis: [
        // Smileys & People
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
        // Food & Drink
        '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥑', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧃', '🧉', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢',
        // Travel & Places
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚟', '🚀', '🛸', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓️', '⛽️', '🚧', '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲️', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺️', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪️', '🕌', '🕍', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁',
        // Activities
        '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥍', '🏹', '🎣', '🥊', '🥋', '🎽', '⛳️', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛷️', '🏂', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🎪', '🛹', '🛷', '⛸️', '🥌', '🎯', '🎲', '🎮', '🎰', '🎳', '🎴', '🃏', '🀄️', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '🎯', '🎳', '🎮',
        // Objects
        '⌚️', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '💊', '💉', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚿', '🛁', '🛀', '🧼', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎉', '🎊', '🎀', '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🎪', '🎭', '🖼️', '🎨', '🧩', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄️', '🎴', '🎯', '🎳', '🎮', '🎰', '🎲', '🧩', '♟️', '🎯', '🎳', '🎮', '🎰', '🎲',
        // Symbols
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔜', '🔝', '✔️', '☑️', '🔘', '⚪️', '⚫️', '🔴', '🔵', '🟠', '🟡', '🟢', '🟣', '🟤', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛️', '⬜️', '🟰', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '▪️', '▫️', '◾️', '◽️', '◼️', '◻️', '🟦', '🟧', '🟨', '🟩', '🟥', '🟪', '🟫', '⬛️', '⬜️',
        // Flags
        '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇯🇵', '🇨🇳', '🇰🇷', '🇮🇳', '🇧🇷', '🇷🇺', '🇲🇽', '🇳🇱', '🇧🇪', '🇨🇭', '🇦🇹', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇬🇷', '🇹🇷', '🇵🇹', '🇮🇪', '🇨🇿', '🇭🇺', '🇷🇴', '🇧🇬', '🇭🇷', '🇸🇮', '🇸🇰', '🇪🇪', '🇱🇻', '🇱🇹', '🇺🇦', '🇧🇾', '🇲🇩', '🇷🇸', '🇲🇪', '🇲🇰', '🇦🇱', '🇧🇦', '🇽🇰', '🇮🇸', '🇱🇮', '🇱🇺', '🇲🇹', '🇲🇨', '🇦🇩', '🇦🇲', '🇦🇿', '🇧🇭', '🇧🇩', '🇧🇹', '🇧🇳', '🇰🇭', '🇨🇳', '🇨🇾', '🇬🇪', '🇭🇰', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇱', '🇯🇵', '🇯🇴', '🇰🇿', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇧', '🇲🇴', '🇲🇾', '🇲🇳', '🇲🇲', '🇳🇵', '🇰🇵', '🇴🇲', '🇵🇰', '🇵🇸', '🇵🇭', '🇶🇦', '🇸🇦', '🇸🇬', '🇰🇷', '🇱🇰', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇭', '🇹🇱', '🇹🇲', '🇦🇪', '🇺🇿', '🇻🇳', '🇾🇪', '🇦🇫', '🇪🇬', '🇪🇹', '🇬🇭', '🇬🇼', '🇰🇪', '🇱🇷', '🇱🇾', '🇲🇬', '🇲🇼', '🇲🇱', '🇲🇷', '🇲🇺', '🇲🇦', '🇲🇿', '🇳🇦', '🇳🇪', '🇳🇬', '🇷🇼', '🇸🇳', '🇸🇱', '🇸🇴', '🇿🇦', '🇸🇸', '🇸🇩', '🇹🇿', '🇹🇬', '🇹🇳', '🇺🇬', '🇿🇲', '🇿🇼', '🇦🇷', '🇧🇴', '🇧🇷', '🇨🇱', '🇨🇴', '🇪🇨', '🇫🇰', '🇬🇫', '🇬🇾', '🇵🇾', '🇵🇪', '🇸🇷', '🇺🇾', '🇻🇪', '🇬🇩', '🇭🇹', '🇯🇲', '🇲🇶', '🇵🇷', '🇧🇸', '🇧🇧', '🇧🇿', '🇨🇷', '🇨🇺', '🇩🇲', '🇩🇴', '🇸🇻', '🇬🇹', '🇭🇳', '🇲🇽', '🇳🇮', '🇵🇦', '🇰🇳', '🇱🇨', '🇻🇨', '🇹🇹', '🇺🇸', '🇦🇮', '🇦🇬', '🇦🇼', '🇧🇸', '🇧🇧', '🇧🇿', '🇧🇲', '🇻🇬', '🇰🇾', '🇨🇰', '🇨🇼', '🇩🇲', '🇩🇴', '🇫🇰', '🇬🇩', '🇬🇵', '🇬🇱', '🇬🇵', '🇬🇹', '🇭🇹', '🇭🇳', '🇯🇲', '🇲🇶', '🇲🇸', '🇵🇷', '🇧🇱', '🇰🇳', '🇱🇨', '🇵🇲', '🇻🇨', '🇻🇮', '🇸🇭', '🇹🇨', '🇹🇹', '🇹🇨', '🇻🇬', '🇻🇮', '🇦🇺', '🇨🇨', '🇨🇽', '🇫🇯', '🇵🇫', '🇬🇺', '🇭🇲', '🇰🇮', '🇲🇭', '🇫🇲', '🇳🇨', '🇳🇿', '🇳🇺', '🇳🇫', '🇲🇵', '🇵🇼', '🇵🇬', '🇵🇳', '🇸🇧', '🇹🇰', '🇹🇴', '🇹🇻', '🇻🇺', '🇼🇫', '🇼🇸', '🇦🇶', '🇧🇻', '🇬🇸', '🇭🇲', '🇹🇫', '🇺🇲', '🇦🇷', '🇧🇴', '🇧🇷', '🇨🇱', '🇨🇴', '🇪🇨', '🇫🇰', '🇬🇫', '🇬🇾', '🇵🇾', '🇵🇪', '🇸🇷', '🇺🇾', '🇻🇪'
    ],

    // Emoji search terms (keywords for searching)
    emojiKeywords: {
        '😀': ['happy', 'smile', 'grin', 'face'],
        '😃': ['happy', 'smile', 'big', 'eyes'],
        '💰': ['money', 'dollar', 'cash', 'coin', 'bag'],
        '💵': ['money', 'dollar', 'bill', 'cash'],
        '💳': ['card', 'credit', 'debit', 'payment'],
        '🍔': ['burger', 'food', 'fast', 'hamburger'],
        '🍕': ['pizza', 'food', 'slice'],
        '☕️': ['coffee', 'drink', 'hot', 'cafe'],
        '🚗': ['car', 'vehicle', 'auto', 'drive'],
        '🏠': ['house', 'home', 'building'],
        '✈️': ['plane', 'airplane', 'flight', 'travel'],
        '🏥': ['hospital', 'medical', 'health'],
        '🎓': ['education', 'graduate', 'school', 'degree'],
        '💼': ['briefcase', 'work', 'business', 'office'],
        '🛒': ['shopping', 'cart', 'store', 'buy'],
        '🍎': ['apple', 'fruit', 'food', 'red'],
        '🏋️': ['gym', 'exercise', 'fitness', 'workout'],
        '🎬': ['movie', 'film', 'cinema', 'entertainment'],
        '🎵': ['music', 'song', 'audio', 'sound'],
        '📱': ['phone', 'mobile', 'cell', 'smartphone'],
        '💻': ['computer', 'laptop', 'pc', 'tech'],
        '🎮': ['game', 'gaming', 'video', 'play'],
        '📚': ['book', 'books', 'reading', 'library'],
        '🎨': ['art', 'paint', 'creative', 'draw'],
        '⚽️': ['soccer', 'football', 'sport', 'ball'],
        '🏀': ['basketball', 'sport', 'ball'],
        '🎯': ['target', 'goal', 'aim', 'dart'],
        '💡': ['light', 'bulb', 'idea', 'bright'],
        '🔑': ['key', 'lock', 'door', 'access'],
        '📧': ['email', 'mail', 'message', 'letter'],
        '📞': ['phone', 'call', 'telephone', 'contact'],
        '🌍': ['world', 'earth', 'globe', 'planet'],
        '⭐️': ['star', 'favorite', 'rating', 'shine'],
        '❤️': ['heart', 'love', 'red', 'like'],
        '🎁': ['gift', 'present', 'box', 'surprise'],
        '🎉': ['party', 'celebration', 'confetti', 'fun'],
        '🎂': ['cake', 'birthday', 'dessert', 'sweet'],
        '🍰': ['cake', 'dessert', 'sweet', 'slice'],
        '🍪': ['cookie', 'sweet', 'snack', 'dessert'],
        '🍫': ['chocolate', 'candy', 'sweet', 'bar'],
        '🍭': ['lollipop', 'candy', 'sweet', 'sucker'],
        '🍬': ['candy', 'sweet', 'sugar', 'treat'],
        '🍩': ['donut', 'doughnut', 'sweet', 'dessert'],
        '🍨': ['ice', 'cream', 'dessert', 'cold'],
        '🍦': ['ice', 'cream', 'cone', 'dessert'],
        '🥤': ['drink', 'soda', 'beverage', 'cup'],
        '🍺': ['beer', 'drink', 'alcohol', 'mug'],
        '🍷': ['wine', 'drink', 'alcohol', 'glass'],
        '🥂': ['champagne', 'toast', 'celebration', 'drink'],
        '🍾': ['champagne', 'bottle', 'celebration', 'party'],
        '🥃': ['whiskey', 'drink', 'alcohol', 'glass'],
        '🍸': ['cocktail', 'drink', 'martini', 'glass'],
        '🍹': ['cocktail', 'drink', 'tropical', 'umbrella'],
        '🧃': ['juice', 'drink', 'box', 'beverage'],
        '🧉': ['mate', 'drink', 'tea', 'beverage'],
        '🧊': ['ice', 'cube', 'cold', 'frozen'],
        '☕️': ['coffee', 'drink', 'hot', 'cafe'],
        '🍵': ['tea', 'drink', 'cup', 'hot'],
        '🥛': ['milk', 'drink', 'glass', 'dairy'],
        '🍼': ['baby', 'bottle', 'milk', 'infant'],
        '🥣': ['bowl', 'soup', 'cereal', 'food'],
        '🍽️': ['plate', 'fork', 'knife', 'dining'],
        '🥢': ['chopsticks', 'eating', 'asian', 'food'],
        '🍴': ['fork', 'knife', 'cutlery', 'eating'],
        '🥄': ['spoon', 'eating', 'utensil', 'soup'],
        '🔪': ['knife', 'cut', 'cooking', 'kitchen'],
        '🏪': ['store', 'shop', 'convenience', 'market'],
        '🏬': ['department', 'store', 'shopping', 'mall'],
        '🏫': ['school', 'education', 'building', 'learn'],
        '🏥': ['hospital', 'medical', 'health', 'doctor'],
        '🏦': ['bank', 'money', 'finance', 'building'],
        '🏨': ['hotel', 'accommodation', 'travel', 'stay'],
        '🏩': ['love', 'hotel', 'romantic', 'couple'],
        '🏪': ['store', 'shop', 'convenience', 'market'],
        '🏫': ['school', 'education', 'building', 'learn'],
        '🏭': ['factory', 'industrial', 'manufacturing', 'work'],
        '🏗️': ['construction', 'building', 'site', 'work'],
        '🏚️': ['house', 'abandoned', 'old', 'building'],
        '🏘️': ['houses', 'neighborhood', 'residential', 'area'],
        '🏡': ['house', 'home', 'garden', 'residential'],
        '🏠': ['house', 'home', 'building', 'residential'],
        '⛺️': ['tent', 'camping', 'outdoor', 'shelter'],
        '🏕️': ['camping', 'outdoor', 'tent', 'nature'],
        '🚐': ['van', 'vehicle', 'camper', 'travel'],
        '🚙': ['suv', 'vehicle', 'car', 'offroad'],
        '🚗': ['car', 'vehicle', 'auto', 'drive'],
        '🚕': ['taxi', 'cab', 'vehicle', 'transport'],
        '🚌': ['bus', 'public', 'transport', 'vehicle'],
        '🚎': ['trolley', 'bus', 'electric', 'transport'],
        '🏎️': ['race', 'car', 'sports', 'fast'],
        '🚓': ['police', 'car', 'cop', 'law'],
        '🚑': ['ambulance', 'medical', 'emergency', 'hospital'],
        '🚒': ['fire', 'truck', 'emergency', 'firefighter'],
        '🚚': ['truck', 'delivery', 'cargo', 'vehicle'],
        '🚛': ['truck', 'large', 'cargo', 'transport'],
        '🚜': ['tractor', 'farm', 'agriculture', 'vehicle'],
        '🛴': ['scooter', 'kick', 'transport', 'ride'],
        '🚲': ['bicycle', 'bike', 'cycle', 'transport'],
        '🛵': ['scooter', 'motor', 'vehicle', 'ride'],
        '🏍️': ['motorcycle', 'bike', 'vehicle', 'ride'],
        '🛺': ['auto', 'rickshaw', 'tuk', 'tuk', 'vehicle'],
        '🚨': ['police', 'light', 'siren', 'emergency'],
        '🚔': ['police', 'car', 'cop', 'law'],
        '🚍': ['bus', 'oncoming', 'transport', 'vehicle'],
        '🚘': ['car', 'oncoming', 'vehicle', 'auto'],
        '🚖': ['taxi', 'oncoming', 'cab', 'vehicle'],
        '🚡': ['aerial', 'tramway', 'cable', 'car'],
        '🚠': ['mountain', 'cableway', 'ski', 'lift'],
        '🚟': ['suspension', 'railway', 'cable', 'car'],
        '🚃': ['railway', 'car', 'train', 'tram'],
        '🚋': ['tram', 'car', 'trolley', 'transport'],
        '🚞': ['mountain', 'railway', 'train', 'cable'],
        '🚝': ['monorail', 'train', 'transport', 'rail'],
        '🚄': ['high', 'speed', 'train', 'bullet'],
        '🚅': ['bullet', 'train', 'fast', 'speed'],
        '🚈': ['light', 'rail', 'train', 'metro'],
        '🚂': ['steam', 'locomotive', 'train', 'rail'],
        '🚆': ['train', 'railway', 'transport', 'rail'],
        '🚇': ['metro', 'subway', 'underground', 'train'],
        '🚊': ['tram', 'trolley', 'streetcar', 'transport'],
        '🚉': ['station', 'train', 'railway', 'platform'],
        '✈️': ['airplane', 'plane', 'flight', 'travel'],
        '🛫': ['airplane', 'departure', 'takeoff', 'flight'],
        '🛬': ['airplane', 'arrival', 'landing', 'flight'],
        '🛩️': ['small', 'airplane', 'private', 'jet'],
        '💺': ['seat', 'airplane', 'flight', 'travel'],
        '🚁': ['helicopter', 'chopper', 'aircraft', 'flight'],
        '🚟': ['suspension', 'railway', 'cable', 'car'],
        '🚀': ['rocket', 'space', 'launch', 'ship'],
        '🛸': ['ufo', 'flying', 'saucer', 'alien'],
        '🚤': ['speedboat', 'boat', 'water', 'fast'],
        '🛥️': ['motor', 'boat', 'yacht', 'water'],
        '🛳️': ['passenger', 'ship', 'cruise', 'boat'],
        '⛴️': ['ferry', 'boat', 'water', 'transport'],
        '🚢': ['ship', 'boat', 'water', 'large'],
        '⚓️': ['anchor', 'ship', 'boat', 'maritime'],
        '⛽️': ['fuel', 'pump', 'gas', 'station'],
        '🚧': ['construction', 'barrier', 'road', 'work'],
        '🚦': ['traffic', 'light', 'signal', 'stop'],
        '🚥': ['horizontal', 'traffic', 'light', 'signal'],
        '🗺️': ['map', 'world', 'geography', 'location'],
        '🗿': ['moai', 'statue', 'easter', 'island'],
        '🗽': ['statue', 'liberty', 'new', 'york'],
        '🗼': ['tokyo', 'tower', 'japan', 'landmark'],
        '🏰': ['castle', 'european', 'fortress', 'building'],
        '🏯': ['japanese', 'castle', 'tower', 'building'],
        '🏟️': ['stadium', 'sports', 'arena', 'venue'],
        '🎡': ['ferris', 'wheel', 'amusement', 'park'],
        '🎢': ['roller', 'coaster', 'amusement', 'park'],
        '🎠': ['carousel', 'merry', 'go', 'round'],
        '⛲️': ['fountain', 'water', 'park', 'decorative'],
        '⛱️': ['umbrella', 'beach', 'sun', 'shade'],
        '🏖️': ['beach', 'umbrella', 'sand', 'vacation'],
        '🏝️': ['desert', 'island', 'tropical', 'vacation'],
        '🏜️': ['desert', 'arid', 'dry', 'landscape'],
        '🌋': ['volcano', 'eruption', 'lava', 'mountain'],
        '⛰️': ['mountain', 'peak', 'summit', 'nature'],
        '🏔️': ['snow', 'capped', 'mountain', 'peak'],
        '🗻': ['mount', 'fuji', 'japan', 'mountain'],
        '🌅': ['sunrise', 'morning', 'dawn', 'sky'],
        '🌄': ['sunrise', 'over', 'mountains', 'dawn'],
        '🌠': ['shooting', 'star', 'meteor', 'wish'],
        '🎇': ['sparkler', 'fireworks', 'celebration', 'sparkle'],
        '🎆': ['fireworks', 'celebration', 'explosion', 'colorful'],
        '🌇': ['sunset', 'evening', 'dusk', 'city'],
        '🌆': ['cityscape', 'dusk', 'evening', 'skyline'],
        '🏙️': ['cityscape', 'urban', 'skyline', 'buildings'],
        '🌃': ['night', 'cityscape', 'stars', 'skyline'],
        '🌌': ['milky', 'way', 'galaxy', 'stars'],
        '🌉': ['bridge', 'night', 'city', 'water'],
        '🌁': ['foggy', 'mist', 'cloudy', 'weather'],
        '⚽️': ['soccer', 'ball', 'football', 'sport'],
        '🏀': ['basketball', 'ball', 'sport', 'hoop'],
        '🏈': ['american', 'football', 'ball', 'sport'],
        '⚾️': ['baseball', 'ball', 'sport', 'bat'],
        '🥎': ['softball', 'ball', 'sport', 'pitch'],
        '🎾': ['tennis', 'ball', 'racket', 'sport'],
        '🏐': ['volleyball', 'ball', 'net', 'sport'],
        '🏉': ['rugby', 'football', 'ball', 'sport'],
        '🥏': ['flying', 'disc', 'frisbee', 'sport'],
        '🎱': ['pool', '8', 'ball', 'billiards'],
        '🏓': ['ping', 'pong', 'table', 'tennis'],
        '🏸': ['badminton', 'racket', 'shuttlecock', 'sport'],
        '🥅': ['goal', 'net', 'soccer', 'hockey'],
        '🏒': ['ice', 'hockey', 'stick', 'puck'],
        '🏑': ['field', 'hockey', 'stick', 'ball'],
        '🏏': ['cricket', 'bat', 'ball', 'sport'],
        '🥍': ['lacrosse', 'stick', 'ball', 'sport'],
        '🏹': ['bow', 'arrow', 'archery', 'sport'],
        '🎣': ['fishing', 'pole', 'fish', 'hook'],
        '🥊': ['boxing', 'glove', 'punch', 'sport'],
        '🥋': ['martial', 'arts', 'uniform', 'karate'],
        '🎽': ['running', 'shirt', 'sash', 'sport'],
        '⛳️': ['flag', 'hole', 'golf', 'sport'],
        '🏌️': ['golf', 'person', 'golfing', 'sport'],
        '🏄': ['surfing', 'person', 'wave', 'ocean'],
        '🏊': ['swimming', 'person', 'pool', 'water'],
        '⛷️': ['skier', 'skiing', 'snow', 'sport'],
        '🏂': ['snowboarder', 'snowboarding', 'snow', 'sport'],
        '🏋️': ['weight', 'lifting', 'person', 'gym'],
        '🚴': ['bicyclist', 'cycling', 'bike', 'sport'],
        '🚵': ['mountain', 'bicyclist', 'cycling', 'bike'],
        '🤸': ['person', 'cartwheeling', 'gymnastics', 'sport'],
        '🤽': ['water', 'polo', 'person', 'sport'],
        '🤾': ['handball', 'person', 'sport', 'ball'],
        '🤹': ['juggling', 'person', 'circus', 'entertainment'],
        '🧘': ['person', 'lotus', 'position', 'yoga'],
        '🎪': ['circus', 'tent', 'entertainment', 'show'],
        '🛹': ['skateboard', 'skating', 'sport', 'ride'],
        '🛷': ['sled', 'snow', 'winter', 'sport'],
        '⛸️': ['ice', 'skate', 'skating', 'winter'],
        '🥌': ['curling', 'stone', 'sport', 'ice'],
        '🎯': ['direct', 'hit', 'target', 'dart'],
        '🎲': ['game', 'die', 'dice', 'gamble'],
        '🎮': ['video', 'game', 'controller', 'gaming'],
        '🎰': ['slot', 'machine', 'casino', 'gamble'],
        '🎳': ['bowling', 'ball', 'pin', 'sport'],
        '🎴': ['flower', 'playing', 'cards', 'game'],
        '🃏': ['joker', 'card', 'wild', 'game'],
        '🀄️': ['mahjong', 'red', 'dragon', 'tile'],
        '🎭': ['performing', 'arts', 'theater', 'masks'],
        '🎨': ['artist', 'palette', 'paint', 'art'],
        '🎬': ['clapper', 'board', 'movie', 'film'],
        '🎤': ['microphone', 'sing', 'karaoke', 'music'],
        '🎧': ['headphone', 'music', 'audio', 'listen'],
        '🎼': ['musical', 'score', 'sheet', 'music'],
        '🎹': ['musical', 'keyboard', 'piano', 'keys'],
        '🥁': ['drum', 'music', 'beat', 'percussion'],
        '🎷': ['saxophone', 'music', 'instrument', 'jazz'],
        '🎺': ['trumpet', 'music', 'instrument', 'brass'],
        '🎸': ['guitar', 'music', 'instrument', 'rock'],
        '🎻': ['violin', 'music', 'instrument', 'string'],
        '🎲': ['game', 'die', 'dice', 'gamble'],
        '🎯': ['direct', 'hit', 'target', 'dart'],
        '🎳': ['bowling', 'ball', 'pin', 'sport'],
        '🎮': ['video', 'game', 'controller', 'gaming'],
        '🎰': ['slot', 'machine', 'casino', 'gamble'],
        '⌚️': ['watch', 'time', 'wrist', 'clock'],
        '📱': ['mobile', 'phone', 'cell', 'smartphone'],
        '📲': ['mobile', 'phone', 'arrow', 'incoming'],
        '💻': ['laptop', 'computer', 'pc', 'tech'],
        '⌨️': ['keyboard', 'computer', 'type', 'keys'],
        '🖥️': ['desktop', 'computer', 'monitor', 'pc'],
        '🖨️': ['printer', 'print', 'office', 'device'],
        '🖱️': ['computer', 'mouse', 'click', 'pointer'],
        '🖲️': ['trackball', 'mouse', 'computer', 'pointer'],
        '🕹️': ['joystick', 'game', 'controller', 'arcade'],
        '🗜️': ['clamp', 'compression', 'tool', 'press'],
        '💾': ['floppy', 'disk', 'save', 'storage'],
        '💿': ['optical', 'disk', 'cd', 'dvd'],
        '📀': ['dvd', 'disk', 'movie', 'video'],
        '📼': ['videocassette', 'tape', 'video', 'vhs'],
        '📷': ['camera', 'photo', 'photography', 'picture'],
        '📸': ['camera', 'flash', 'photo', 'picture'],
        '📹': ['video', 'camera', 'recording', 'movie'],
        '🎥': ['movie', 'camera', 'film', 'cinema'],
        '📽️': ['film', 'projector', 'movie', 'cinema'],
        '🎞️': ['film', 'frames', 'movie', 'cinema'],
        '📞': ['telephone', 'receiver', 'phone', 'call'],
        '☎️': ['telephone', 'phone', 'call', 'contact'],
        '📟': ['pager', 'beeper', 'communication', 'device'],
        '📠': ['fax', 'machine', 'office', 'document'],
        '📺': ['television', 'tv', 'screen', 'broadcast'],
        '📻': ['radio', 'music', 'broadcast', 'audio'],
        '🎙️': ['studio', 'microphone', 'recording', 'audio'],
        '🎚️': ['level', 'slider', 'control', 'audio'],
        '🎛️': ['control', 'knobs', 'audio', 'settings'],
        '⏱️': ['stopwatch', 'timer', 'time', 'measure'],
        '⏲️': ['timer', 'clock', 'alarm', 'time'],
        '⏰': ['alarm', 'clock', 'wake', 'up', 'time'],
        '🕰️': ['mantelpiece', 'clock', 'time', 'decorative'],
        '⌛️': ['hourglass', 'done', 'time', 'sand'],
        '⏳': ['hourglass', 'not', 'done', 'time'],
        '📡': ['satellite', 'antenna', 'communication', 'signal'],
        '🔋': ['battery', 'power', 'energy', 'charge'],
        '🔌': ['electric', 'plug', 'power', 'socket'],
        '💡': ['light', 'bulb', 'idea', 'bright'],
        '🔦': ['flashlight', 'torch', 'light', 'beam'],
        '🕯️': ['candle', 'light', 'flame', 'wax'],
        '🧯': ['fire', 'extinguisher', 'safety', 'emergency'],
        '🛢️': ['oil', 'drum', 'fuel', 'container'],
        '💸': ['money', 'wings', 'flying', 'dollar'],
        '💵': ['dollar', 'banknote', 'money', 'cash'],
        '💴': ['yen', 'banknote', 'money', 'japanese'],
        '💶': ['euro', 'banknote', 'money', 'european'],
        '💷': ['pound', 'banknote', 'money', 'british'],
        '💰': ['money', 'bag', 'dollar', 'cash'],
        '💳': ['credit', 'card', 'payment', 'bank'],
        '💎': ['gem', 'stone', 'diamond', 'jewel'],
        '⚖️': ['balance', 'scale', 'justice', 'law'],
        '🧰': ['toolbox', 'tools', 'repair', 'fix'],
        '🔧': ['wrench', 'tool', 'repair', 'fix'],
        '🔨': ['hammer', 'tool', 'construction', 'build'],
        '⚒️': ['hammer', 'pick', 'tools', 'construction'],
        '🛠️': ['hammer', 'wrench', 'tools', 'repair'],
        '⛏️': ['pick', 'tool', 'mining', 'dig'],
        '🔩': ['nut', 'bolt', 'screw', 'hardware'],
        '⚙️': ['gear', 'cog', 'settings', 'mechanical'],
        '🧱': ['brick', 'construction', 'building', 'wall'],
        '⛓️': ['chains', 'link', 'connection', 'bond'],
        '🧲': ['magnet', 'attraction', 'magnetic', 'pull'],
        '🔫': ['water', 'pistol', 'gun', 'toy'],
        '💣': ['bomb', 'explosive', 'danger', 'weapon'],
        '🧨': ['firecracker', 'explosive', 'celebration', 'fireworks'],
        '🔪': ['kitchen', 'knife', 'cut', 'cooking'],
        '🗡️': ['dagger', 'sword', 'weapon', 'blade'],
        '⚔️': ['crossed', 'swords', 'weapon', 'battle'],
        '🛡️': ['shield', 'protection', 'defense', 'guard'],
        '🚬': ['cigarette', 'smoke', 'tobacco', 'smoking'],
        '⚰️': ['coffin', 'death', 'funeral', 'burial'],
        '⚱️': ['funeral', 'urn', 'death', 'ashes'],
        '🏺': ['amphora', 'pottery', 'vase', 'ancient'],
        '🔮': ['crystal', 'ball', 'fortune', 'magic'],
        '📿': ['prayer', 'beads', 'religion', 'rosary'],
        '🧿': ['nazar', 'amulet', 'evil', 'eye'],
        '💈': ['barber', 'pole', 'haircut', 'salon'],
        '⚗️': ['alembic', 'chemistry', 'science', 'distillation'],
        '🔭': ['telescope', 'astronomy', 'space', 'stars'],
        '🔬': ['microscope', 'science', 'laboratory', 'research'],
        '🕳️': ['hole', 'opening', 'empty', 'space'],
        '💊': ['pill', 'medicine', 'drug', 'health'],
        '💉': ['syringe', 'medicine', 'injection', 'health'],
        '🧬': ['dna', 'double', 'helix', 'genetics'],
        '🦠': ['microbe', 'bacteria', 'virus', 'germ'],
        '🧫': ['petri', 'dish', 'bacteria', 'culture'],
        '🧪': ['test', 'tube', 'chemistry', 'experiment'],
        '🌡️': ['thermometer', 'temperature', 'weather', 'hot'],
        '🧹': ['broom', 'clean', 'sweep', 'housework'],
        '🧺': ['basket', 'laundry', 'storage', 'container'],
        '🧻': ['roll', 'toilet', 'paper', 'bathroom'],
        '🚽': ['toilet', 'bathroom', 'restroom', 'wc'],
        '🚿': ['shower', 'bathroom', 'water', 'clean'],
        '🛁': ['bathtub', 'bath', 'bathroom', 'relax'],
        '🛀': ['person', 'taking', 'bath', 'bathroom'],
        '🧼': ['soap', 'clean', 'wash', 'bathroom'],
        '🧽': ['sponge', 'clean', 'wash', 'kitchen'],
        '🧴': ['lotion', 'bottle', 'cream', 'skincare'],
        '🛎️': ['bellhop', 'bell', 'hotel', 'service'],
        '🔑': ['key', 'lock', 'door', 'access'],
        '🗝️': ['old', 'key', 'lock', 'antique'],
        '🚪': ['door', 'entrance', 'exit', 'room'],
        '🛋️': ['couch', 'lamp', 'sofa', 'furniture'],
        '🛏️': ['bed', 'sleep', 'furniture', 'room'],
        '🛌': ['person', 'bed', 'sleeping', 'rest'],
        '🧸': ['teddy', 'bear', 'toy', 'stuffed'],
        '🖼️': ['framed', 'picture', 'art', 'photo'],
        '🛍️': ['shopping', 'bags', 'store', 'buy'],
        '🛒': ['shopping', 'cart', 'store', 'buy'],
        '🎁': ['wrapped', 'gift', 'present', 'box'],
        '🎈': ['balloon', 'party', 'celebration', 'birthday'],
        '🎉': ['party', 'popper', 'celebration', 'confetti'],
        '🎊': ['confetti', 'ball', 'celebration', 'party'],
        '🎀': ['ribbon', 'bow', 'decoration', 'gift'],
        '🎃': ['jack', 'o', 'lantern', 'halloween'],
        '🎄': ['christmas', 'tree', 'holiday', 'decorated'],
        '🎆': ['fireworks', 'celebration', 'explosion', 'colorful'],
        '🎇': ['sparkler', 'fireworks', 'celebration', 'sparkle'],
        '🧨': ['firecracker', 'explosive', 'celebration', 'fireworks'],
        '✨': ['sparkles', 'star', 'shine', 'magic'],
        '🎈': ['balloon', 'party', 'celebration', 'birthday'],
        '🎉': ['party', 'popper', 'celebration', 'confetti'],
        '🎊': ['confetti', 'ball', 'celebration', 'party'],
        '🎋': ['tanabata', 'tree', 'japanese', 'festival'],
        '🎍': ['pine', 'decoration', 'japanese', 'new', 'year'],
        '🎎': ['japanese', 'dolls', 'decoration', 'festival'],
        '🎏': ['carp', 'streamer', 'japanese', 'children', 'day'],
        '🎐': ['wind', 'chime', 'decoration', 'sound'],
        '🎑': ['moon', 'viewing', 'ceremony', 'japanese'],
        '🧧': ['red', 'envelope', 'chinese', 'new', 'year'],
        '🎀': ['ribbon', 'bow', 'decoration', 'gift'],
        '🎁': ['wrapped', 'gift', 'present', 'box'],
        '🎗️': ['reminder', 'ribbon', 'awareness', 'support'],
        '🎟️': ['admission', 'tickets', 'entrance', 'event'],
        '🎫': ['ticket', 'admission', 'entrance', 'event'],
        '🎪': ['circus', 'tent', 'entertainment', 'show'],
        '🎭': ['performing', 'arts', 'theater', 'masks'],
        '🖼️': ['framed', 'picture', 'art', 'photo'],
        '🎨': ['artist', 'palette', 'paint', 'art'],
        '🧩': ['puzzle', 'piece', 'jigsaw', 'game'],
        '♠️': ['spade', 'suit', 'card', 'game'],
        '♥️': ['heart', 'suit', 'card', 'game'],
        '♦️': ['diamond', 'suit', 'card', 'game'],
        '♣️': ['club', 'suit', 'card', 'game'],
        '🃏': ['joker', 'card', 'wild', 'game'],
        '🀄️': ['mahjong', 'red', 'dragon', 'tile'],
        '🎴': ['flower', 'playing', 'cards', 'game'],
        '🎯': ['direct', 'hit', 'target', 'dart'],
        '🎳': ['bowling', 'ball', 'pin', 'sport'],
        '🎮': ['video', 'game', 'controller', 'gaming'],
        '🎰': ['slot', 'machine', 'casino', 'gamble'],
        '🎲': ['game', 'die', 'dice', 'gamble'],
        '🧩': ['puzzle', 'piece', 'jigsaw', 'game'],
        '♟️': ['chess', 'pawn', 'game', 'piece'],
        '🎯': ['direct', 'hit', 'target', 'dart'],
        '🎳': ['bowling', 'ball', 'pin', 'sport'],
        '🎮': ['video', 'game', 'controller', 'gaming'],
        '🎰': ['slot', 'machine', 'casino', 'gamble'],
        '🎲': ['game', 'die', 'dice', 'gamble'],
        '❤️': ['red', 'heart', 'love', 'like'],
        '🧡': ['orange', 'heart', 'love', 'like'],
        '💛': ['yellow', 'heart', 'love', 'like'],
        '💚': ['green', 'heart', 'love', 'like'],
        '💙': ['blue', 'heart', 'love', 'like'],
        '💜': ['purple', 'heart', 'love', 'like'],
        '🖤': ['black', 'heart', 'love', 'like'],
        '🤍': ['white', 'heart', 'love', 'like'],
        '🤎': ['brown', 'heart', 'love', 'like'],
        '💔': ['broken', 'heart', 'sad', 'love'],
        '❣️': ['heart', 'exclamation', 'love', 'emphasis'],
        '💕': ['two', 'hearts', 'love', 'romance'],
        '💞': ['revolving', 'hearts', 'love', 'romance'],
        '💓': ['beating', 'heart', 'love', 'pulse'],
        '💗': ['growing', 'heart', 'love', 'increase'],
        '💖': ['sparkling', 'heart', 'love', 'shine'],
        '💘': ['heart', 'arrow', 'cupid', 'love'],
        '💝': ['heart', 'ribbon', 'gift', 'love'],
        '💟': ['heart', 'decoration', 'love', 'ornament'],
        '☮️': ['peace', 'symbol', 'peaceful', 'protest'],
        '✝️': ['latin', 'cross', 'christianity', 'religion'],
        '☪️': ['star', 'crescent', 'islam', 'religion'],
        '🕉️': ['om', 'hinduism', 'religion', 'symbol'],
        '☸️': ['wheel', 'dharma', 'buddhism', 'religion'],
        '✡️': ['star', 'david', 'judaism', 'religion'],
        '🔯': ['dotted', 'six', 'pointed', 'star'],
        '🕎': ['menorah', 'judaism', 'hanukkah', 'religion'],
        '☯️': ['yin', 'yang', 'taoism', 'balance'],
        '☦️': ['orthodox', 'cross', 'christianity', 'religion'],
        '🛐': ['place', 'worship', 'religion', 'prayer'],
        '⛎': ['ophiuchus', 'zodiac', 'astrology', 'sign'],
        '♈️': ['aries', 'zodiac', 'astrology', 'ram'],
        '♉️': ['taurus', 'zodiac', 'astrology', 'bull'],
        '♊️': ['gemini', 'zodiac', 'astrology', 'twins'],
        '♋️': ['cancer', 'zodiac', 'astrology', 'crab'],
        '♌️': ['leo', 'zodiac', 'astrology', 'lion'],
        '♍️': ['virgo', 'zodiac', 'astrology', 'maiden'],
        '♎️': ['libra', 'zodiac', 'astrology', 'scales'],
        '♏️': ['scorpio', 'zodiac', 'astrology', 'scorpion'],
        '♐️': ['sagittarius', 'zodiac', 'astrology', 'archer'],
        '♑️': ['capricorn', 'zodiac', 'astrology', 'goat'],
        '♒️': ['aquarius', 'zodiac', 'astrology', 'water', 'bearer'],
        '♓️': ['pisces', 'zodiac', 'astrology', 'fish'],
        '🆔': ['identification', 'card', 'id', 'identity'],
        '⚛️': ['atom', 'symbol', 'science', 'physics'],
        '🉑': ['japanese', 'acceptable', 'button', 'ok'],
        '☢️': ['radioactive', 'nuclear', 'danger', 'warning'],
        '☣️': ['biohazard', 'danger', 'warning', 'toxic'],
        '📴': ['mobile', 'phone', 'off', 'no', 'signal'],
        '📳': ['mobile', 'phone', 'vibration', 'mode'],
        '🈶': ['japanese', 'not', 'free', 'charge', 'button'],
        '🈚️': ['japanese', 'free', 'charge', 'button'],
        '🈸': ['japanese', 'application', 'button'],
        '🈺': ['japanese', 'open', 'business', 'button'],
        '🈷️': ['japanese', 'monthly', 'amount', 'button'],
        '✴️': ['eight', 'pointed', 'star', 'asterisk'],
        '🆚': ['vs', 'button', 'versus', 'against'],
        '💮': ['white', 'flower', 'japanese', 'good', 'grade'],
        '🉐': ['japanese', 'bargain', 'button', 'discount'],
        '㊙️': ['japanese', 'secret', 'button'],
        '㊗️': ['japanese', 'congratulations', 'button'],
        '🈴': ['japanese', 'passing', 'grade', 'button'],
        '🈵': ['japanese', 'no', 'vacancy', 'button'],
        '🈹': ['japanese', 'discount', 'button'],
        '🈲': ['japanese', 'prohibited', 'button'],
        '🅰️': ['a', 'blood', 'type', 'button'],
        '🅱️': ['b', 'blood', 'type', 'button'],
        '🆎': ['ab', 'blood', 'type', 'button'],
        '🆑': ['cl', 'button', 'clear'],
        '🅾️': ['o', 'blood', 'type', 'button'],
        '🆘': ['sos', 'button', 'help', 'emergency'],
        '❌': ['cross', 'mark', 'no', 'wrong'],
        '⭕️': ['heavy', 'large', 'circle', 'yes', 'ok'],
        '🛑': ['stop', 'sign', 'octagon', 'traffic'],
        '⛔️': ['no', 'entry', 'prohibited', 'forbidden'],
        '📛': ['name', 'badge', 'identification', 'tag'],
        '🚫': ['prohibited', 'no', 'entry', 'forbidden'],
        '💯': ['hundred', 'points', 'perfect', 'score'],
        '💢': ['anger', 'symbol', 'mad', 'angry'],
        '♨️': ['hot', 'springs', 'steam', 'bath'],
        '🚷': ['no', 'pedestrians', 'prohibited', 'walking'],
        '🚯': ['no', 'littering', 'prohibited', 'trash'],
        '🚳': ['no', 'bicycles', 'prohibited', 'bike'],
        '🚱': ['non', 'potable', 'water', 'unsafe'],
        '🔞': ['no', 'one', 'under', 'eighteen', 'prohibited'],
        '📵': ['no', 'mobile', 'phones', 'prohibited'],
        '🚭': ['no', 'smoking', 'prohibited', 'cigarette'],
        '❗️': ['exclamation', 'red', 'mark', 'warning'],
        '❓': ['question', 'red', 'mark', 'help'],
        '❕': ['exclamation', 'white', 'mark', 'emphasis'],
        '❔': ['question', 'white', 'mark', 'help'],
        '‼️': ['double', 'exclamation', 'mark', 'emphasis'],
        '⁉️': ['exclamation', 'question', 'mark', 'interrobang'],
        '🔅': ['dim', 'button', 'low', 'brightness'],
        '🔆': ['bright', 'button', 'high', 'brightness'],
        '〽️': ['part', 'alternation', 'mark', 'japanese'],
        '⚠️': ['warning', 'caution', 'danger', 'alert'],
        '🚸': ['children', 'crossing', 'warning', 'school'],
        '🔱': ['trident', 'emblem', 'power', 'weapon'],
        '⚜️': ['fleur', 'de', 'lis', 'france'],
        '🔰': ['japanese', 'symbol', 'beginner', 'novice'],
        '♻️': ['recycling', 'symbol', 'environment', 'green'],
        '✅': ['check', 'mark', 'button', 'correct'],
        '🈯️': ['japanese', 'reserved', 'button'],
        '💹': ['chart', 'increasing', 'yen', 'money'],
        '❇️': ['sparkle', 'decoration', 'shine'],
        '✳️': ['eight', 'spoked', 'asterisk', 'star'],
        '❎': ['cross', 'mark', 'button', 'wrong'],
        '🌐': ['globe', 'meridians', 'world', 'internet'],
        '💠': ['diamond', 'shape', 'dot', 'inside'],
        'Ⓜ️': ['circled', 'm', 'metro', 'subway'],
        '🌀': ['cyclone', 'hurricane', 'typhoon', 'storm'],
        '💤': ['zzz', 'sleep', 'tired', 'snore'],
        '🏧': ['atm', 'sign', 'money', 'bank'],
        '🚾': ['water', 'closet', 'wc', 'toilet'],
        '♿️': ['wheelchair', 'symbol', 'accessibility', 'disabled'],
        '🅿️': ['p', 'button', 'parking'],
        '🈳': ['japanese', 'vacancy', 'button'],
        '🈂️': ['japanese', 'service', 'charge', 'button'],
        '🛂': ['passport', 'control', 'customs', 'immigration'],
        '🛃': ['customs', 'border', 'control', 'immigration'],
        '🛄': ['baggage', 'claim', 'luggage', 'airport'],
        '🛅': ['left', 'luggage', 'baggage', 'airport'],
        '🚹': ['mens', 'room', 'bathroom', 'restroom'],
        '🚺': ['womens', 'room', 'bathroom', 'restroom'],
        '🚼': ['baby', 'symbol', 'infant', 'child'],
        '🚻': ['restroom', 'bathroom', 'wc', 'toilet'],
        '🚮': ['litter', 'bin', 'trash', 'can'],
        '🎦': ['cinema', 'movie', 'theater', 'film'],
        '📶': ['antenna', 'bars', 'signal', 'reception'],
        '🈁': ['japanese', 'here', 'button', 'location'],
        '🔣': ['input', 'symbols', 'keyboard', 'characters'],
        'ℹ️': ['information', 'i', 'button', 'help'],
        '🔤': ['input', 'latin', 'letters', 'alphabet'],
        '🔡': ['input', 'latin', 'lowercase', 'letters'],
        '🔠': ['input', 'latin', 'uppercase', 'letters'],
        '🆖': ['ng', 'button', 'no', 'good'],
        '🆗': ['ok', 'button', 'good', 'yes'],
        '🆙': ['up', 'button', 'increase', 'raise'],
        '🆒': ['cool', 'button', 'awesome', 'great'],
        '🆕': ['new', 'button', 'fresh', 'recent'],
        '🆓': ['free', 'button', 'no', 'charge'],
        '0️⃣': ['keycap', 'digit', 'zero', 'number'],
        '1️⃣': ['keycap', 'digit', 'one', 'number'],
        '2️⃣': ['keycap', 'digit', 'two', 'number'],
        '3️⃣': ['keycap', 'digit', 'three', 'number'],
        '4️⃣': ['keycap', 'digit', 'four', 'number'],
        '5️⃣': ['keycap', 'digit', 'five', 'number'],
        '6️⃣': ['keycap', 'digit', 'six', 'number'],
        '7️⃣': ['keycap', 'digit', 'seven', 'number'],
        '8️⃣': ['keycap', 'digit', 'eight', 'number'],
        '9️⃣': ['keycap', 'digit', 'nine', 'number'],
        '🔟': ['keycap', 'digit', 'ten', 'number'],
        '🔢': ['input', 'numbers', 'digits', 'numeric'],
        '#️⃣': ['keycap', 'hash', 'number', 'pound'],
        '*️⃣': ['keycap', 'asterisk', 'star', 'multiply'],
        '⏏️': ['eject', 'button', 'remove', 'disk'],
        '▶️': ['play', 'button', 'start', 'video'],
        '⏸️': ['pause', 'button', 'stop', 'video'],
        '⏯️': ['play', 'pause', 'button', 'toggle'],
        '⏹️': ['stop', 'button', 'end', 'video'],
        '⏺️': ['record', 'button', 'recording', 'video'],
        '⏭️': ['next', 'track', 'button', 'skip'],
        '⏮️': ['last', 'track', 'button', 'previous'],
        '⏩': ['fast', 'forward', 'button', 'speed'],
        '⏪': ['fast', 'reverse', 'button', 'rewind'],
        '⏫': ['fast', 'up', 'button', 'increase'],
        '⏬': ['fast', 'down', 'button', 'decrease'],
        '◀️': ['reverse', 'button', 'back', 'previous'],
        '🔼': ['up', 'button', 'increase', 'raise'],
        '🔽': ['down', 'button', 'decrease', 'lower'],
        '➡️': ['right', 'arrow', 'next', 'forward'],
        '⬅️': ['left', 'arrow', 'back', 'previous'],
        '⬆️': ['up', 'arrow', 'increase', 'raise'],
        '⬇️': ['down', 'arrow', 'decrease', 'lower'],
        '↗️': ['up', 'right', 'arrow', 'diagonal'],
        '↘️': ['down', 'right', 'arrow', 'diagonal'],
        '↙️': ['down', 'left', 'arrow', 'diagonal'],
        '↖️': ['up', 'left', 'arrow', 'diagonal'],
        '↕️': ['up', 'down', 'arrow', 'vertical'],
        '↔️': ['left', 'right', 'arrow', 'horizontal'],
        '↪️': ['right', 'arrow', 'curving', 'left'],
        '↩️': ['left', 'arrow', 'curving', 'right'],
        '⤴️': ['right', 'arrow', 'curving', 'up'],
        '⤵️': ['right', 'arrow', 'curving', 'down'],
        '🔀': ['shuffle', 'tracks', 'button', 'random'],
        '🔁': ['repeat', 'button', 'loop', 'again'],
        '🔂': ['repeat', 'single', 'button', 'one'],
        '🔄': ['counterclockwise', 'arrows', 'button', 'refresh'],
        '🔃': ['clockwise', 'downwards', 'upwards', 'arrows'],
        '🎵': ['musical', 'note', 'music', 'sound'],
        '🎶': ['musical', 'notes', 'music', 'sound'],
        '➕': ['plus', 'sign', 'add', 'increase'],
        '➖': ['minus', 'sign', 'subtract', 'decrease'],
        '➗': ['division', 'sign', 'divide', 'math'],
        '✖️': ['multiplication', 'sign', 'multiply', 'times'],
        '💲': ['heavy', 'dollar', 'sign', 'money'],
        '💱': ['currency', 'exchange', 'money', 'convert'],
        '™️': ['trade', 'mark', 'trademark', 'brand'],
        '©️': ['copyright', 'sign', 'legal', 'rights'],
        '®️': ['registered', 'sign', 'trademark', 'legal'],
        '〰️': ['wavy', 'dash', 'line', 'decoration'],
        '➰': ['curly', 'loop', 'decoration', 'line'],
        '➿': ['double', 'curly', 'loop', 'decoration'],
        '🔚': ['end', 'arrow', 'finish', 'complete'],
        '🔙': ['back', 'arrow', 'return', 'previous'],
        '🔛': ['on', 'arrow', 'active', 'current'],
        '🔜': ['soon', 'arrow', 'future', 'coming'],
        '🔝': ['top', 'arrow', 'up', 'first'],
        '✔️': ['check', 'mark', 'correct', 'yes'],
        '☑️': ['check', 'box', 'with', 'check', 'selected'],
        '🔘': ['radio', 'button', 'select', 'option'],
        '⚪️': ['white', 'circle', 'empty', 'hollow'],
        '⚫️': ['black', 'circle', 'filled', 'solid'],
        '🔴': ['red', 'circle', 'filled', 'solid'],
        '🔵': ['blue', 'circle', 'filled', 'solid'],
        '🟠': ['orange', 'circle', 'filled', 'solid'],
        '🟡': ['yellow', 'circle', 'filled', 'solid'],
        '🟢': ['green', 'circle', 'filled', 'solid'],
        '🟣': ['purple', 'circle', 'filled', 'solid'],
        '🟤': ['brown', 'circle', 'filled', 'solid'],
        '🟥': ['red', 'square', 'filled', 'solid'],
        '🟧': ['orange', 'square', 'filled', 'solid'],
        '🟨': ['yellow', 'square', 'filled', 'solid'],
        '🟩': ['green', 'square', 'filled', 'solid'],
        '🟦': ['blue', 'square', 'filled', 'solid'],
        '🟪': ['purple', 'square', 'filled', 'solid'],
        '🟫': ['brown', 'square', 'filled', 'solid'],
        '⬛️': ['black', 'large', 'square', 'filled'],
        '⬜️': ['white', 'large', 'square', 'empty'],
        '🟰': ['heavy', 'equals', 'sign', 'math'],
        '🔶': ['large', 'orange', 'diamond', 'shape'],
        '🔷': ['large', 'blue', 'diamond', 'shape'],
        '🔸': ['small', 'orange', 'diamond', 'shape'],
        '🔹': ['small', 'blue', 'diamond', 'shape'],
        '🔺': ['red', 'triangle', 'pointed', 'up'],
        '🔻': ['red', 'triangle', 'pointed', 'down'],
        '💠': ['diamond', 'shape', 'dot', 'inside'],
        '🔘': ['radio', 'button', 'select', 'option'],
        '🔳': ['white', 'square', 'button', 'empty'],
        '🔲': ['black', 'square', 'button', 'filled'],
        '▪️': ['black', 'small', 'square', 'filled'],
        '▫️': ['white', 'small', 'square', 'empty'],
        '◾️': ['black', 'medium', 'small', 'square'],
        '◽️': ['white', 'medium', 'small', 'square'],
        '◼️': ['black', 'medium', 'square', 'filled'],
        '◻️': ['white', 'medium', 'square', 'empty'],
        '🟦': ['blue', 'square', 'filled', 'solid'],
        '🟧': ['orange', 'square', 'filled', 'solid'],
        '🟨': ['yellow', 'square', 'filled', 'solid'],
        '🟩': ['green', 'square', 'filled', 'solid'],
        '🟥': ['red', 'square', 'filled', 'solid'],
        '🟪': ['purple', 'square', 'filled', 'solid'],
        '🟫': ['brown', 'square', 'filled', 'solid'],
        '⬛️': ['black', 'large', 'square', 'filled'],
        '⬜️': ['white', 'large', 'square', 'empty']
    },

    // Search emojis by keyword
    searchEmojis(query) {
        if (!query || query.trim() === '') {
            return this.emojis;
        }
        
        const searchTerm = query.toLowerCase().trim();
        const results = new Set();
        
        // Search in keywords
        for (const [emoji, keywords] of Object.entries(this.emojiKeywords)) {
            const keywordString = keywords.join(' ').toLowerCase();
            if (keywordString.includes(searchTerm)) {
                results.add(emoji);
            }
        }
        
        // Also search in emoji list directly (for exact matches)
        this.emojis.forEach(emoji => {
            if (emoji.includes(searchTerm)) {
                results.add(emoji);
            }
        });
        
        return Array.from(results);
    },

    // Show emoji picker
    show(callback, currentIcon = '') {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'emoji-picker-overlay';
        overlay.id = 'emoji-picker-overlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'emoji-picker-modal';
        
        // Create header with search
        const header = document.createElement('div');
        header.className = 'emoji-picker-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Choose an Icon';
        header.appendChild(title);
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'emoji-picker-search';
        searchInput.placeholder = 'Search emojis...';
        header.appendChild(searchInput);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'emoji-picker-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.hide();
        header.appendChild(closeBtn);
        
        modal.appendChild(header);
        
        // Create emoji grid
        const grid = document.createElement('div');
        grid.className = 'emoji-picker-grid';
        grid.id = 'emoji-picker-grid';
        
        // Populate grid
        this.populateGrid(grid, this.emojis, callback, currentIcon);
        
        // Search functionality
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value;
                const results = this.searchEmojis(query);
                this.populateGrid(grid, results, callback, currentIcon);
            }, 150);
        });
        
        modal.appendChild(grid);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Focus search input
        setTimeout(() => {
            searchInput.focus();
        }, 100);
        
        // Close on overlay click (but not on modal content)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hide();
            }
        });
        
        // Prevent clicks inside modal from closing it
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Ensure search input is clickable
        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close on Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hide();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    },

    populateGrid(grid, emojis, callback, currentIcon) {
        grid.innerHTML = '';
        
        // Add "Remove icon" option if there's a current icon
        if (currentIcon) {
            const removeBtn = document.createElement('div');
            removeBtn.className = 'emoji-option remove-emoji';
            removeBtn.innerHTML = '<span style="font-size: 20px;">×</span><span style="font-size: 12px; margin-top: 4px;">Remove</span>';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Remove icon clicked');
                callback('');
                this.hide();
            };
            grid.appendChild(removeBtn);
        }
        
        // Add emojis
        emojis.forEach(emoji => {
            // Store emoji in a local variable to ensure it's captured in the closure
            const emojiValue = emoji;
            
            const emojiBtn = document.createElement('div');
            emojiBtn.className = 'emoji-option';
            if (emojiValue === currentIcon) {
                emojiBtn.classList.add('selected');
            }
            emojiBtn.textContent = emojiValue;
            emojiBtn.title = emojiValue;
            emojiBtn.dataset.emoji = emojiValue; // Store emoji in data attribute as backup
            
            emojiBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Get emoji from data attribute first, then closure variable, then textContent
                const selectedEmoji = emojiBtn.dataset.emoji || emojiValue || emojiBtn.textContent.trim();
                console.log('Emoji button clicked:', { 
                    emojiValue, 
                    textContent: emojiBtn.textContent, 
                    textContentTrimmed: emojiBtn.textContent.trim(),
                    dataset: emojiBtn.dataset.emoji, 
                    selectedEmoji,
                    selectedEmojiLength: selectedEmoji ? selectedEmoji.length : 0
                });
                if (selectedEmoji && selectedEmoji.length > 0) {
                    console.log('Calling callback with:', selectedEmoji);
                    callback(selectedEmoji);
                    this.hide();
                } else {
                    console.error('Selected emoji is empty!', { emojiValue, dataset: emojiBtn.dataset.emoji, textContent: emojiBtn.textContent });
                }
            };
            grid.appendChild(emojiBtn);
        });
        
        if (emojis.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'emoji-picker-no-results';
            noResults.textContent = 'No emojis found';
            grid.appendChild(noResults);
        }
    },

    hide() {
        const overlay = document.getElementById('emoji-picker-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

// Make available globally
window.EmojiPicker = EmojiPicker;
