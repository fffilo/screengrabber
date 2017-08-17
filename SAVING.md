## Saving screenshots

When user select screenshot (desktop, monitor, window, selection) a temporary `png` image is created
(usually in `/tmp` directory). If _filename template_ is set (in preferences) file will be moved
to defined location (from template) with following replace rules...

Note:  user `Pictures` directory with bla bla

Default value of filename template is `Screenshot from %Y-%m-%d %H-%M-%S.png`.

### Datetime

C library function `strftime`

| Specifier | Replaced By                                                                | Example                    |
| ----------| -------------------------------------------------------------------------- | -------------------------- |
| `%a`      | abbreviated weekday name                                                   | `Sun`                      |
| `%A`      | full weekday name                                                          | `Sunday`                   |
| `%b`      | abbreviated month name                                                     | `Mar`                      |
| `%B`      | full month name                                                            | `March`                    |
| `%c`      | date and time representation                                               | `Sun Aug 19 02:56:02 2012` |
| `%d`      | day of the month (`01`-`31`)                                               | `19`                       |
| `%H`      | hour in 24h format (`00`-`23`)                                             | `14`                       |
| `%I`      | hour in 12h format (`01`-`12`)                                             | `05`                       |
| `%j`      | day of the year (`001`-`366`)                                              | `231`                      |
| `%m`      | month as a decimal number (`01`-`12`)                                      | `08`                       |
| `%M`      | minute (`00`-`59`)                                                         | `55`                       |
| `%p`      | `AM` or `PM` designation                                                   | `PM`                       |
| `%S`      | second (`00`-`61`)                                                         | `02`                       |
| `%U`      | week number with the first Sunday as the first day of week one (`00`-`53`) | `33`                       |
| `%w`      | weekday as a decimal number with Sunday as 0 (`0`-`6`)                     | `4`                        |
| `%W`      | week number with the first Monday as the first day of week one (`00`-`53`) | `34`                       |
| `%x`      | date representation                                                        | `08/19/12`                 |
| `%X`      | time representation                                                        | `02:50:06`                 |
| `%y`      | year, last two digits (`00`-`99`)                                          | `01`                       |
| `%Y`      | year                                                                       | `2012`                     |
| `%Z`      | timezone name or abbreviation                                              | `CDT`                      |
| `%%`      | a `%` sign                                                                 | `%`                        |

### User directories

| Specifier       | Replaced By                 | Example                   |
| --------------- | --------------------------- | ------------------------- |
| `$tmp`          | temp directory              | `/tmp`                    |
| `$home`         | user's home directory       | `/home/jdoe`              |
| `$cache`        | user's cache directory      | `/home/jdoe/.cache`       |
| `$config`       | user's cache directory      | `/home/jdoe/.config`      |
| `$data`         | user's data directory       | `/home/jdoe/.local/share` |
| `$desktop`      | user's Desktop directory    | `/home/jdoe/Desktop`      |
| `$documents`    | user's Documents directory  | `/home/jdoe/Documents`    |
| `$download`     | user's Downloads directory  | `/home/jdoe/Desktop`      |
| `$music`        | user's Music directory      | `/home/jdoe/Downloads`    |
| `$pictures`     | user's Pictures directory   | `/home/jdoe/Pictures`     |
| `$public_share` | user's shared directory     | `/home/jdoe/Public`       |
| `$templates`    | user's Templates directory  | `/home/jdoe/Templates`    |
| `$videos`       | user's Movies directory     | `/home/jdoe/Videos`       |

Note: bash $ {} bla bla...

### Other

| Specifier    | Replaced By               | Example     |
| ------------ | ------------------------- | ----------- |
| `{username}` | user name of current user | `jdoe`      |
| `{realname}` | real name of current user | `John Doe`  |
| `{hostname}` | name for the machine      | `localhost` |
| `{width}`    | screenshot width          | `640`       |
| `{height}`   | screenshot height         | `480`       |
