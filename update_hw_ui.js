const fs = require('fs');
const file = 'apps/mobile/src/features/homework/screens/HomeworkScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldUI = `                    ))}
                  </ScrollView>
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Section</Text>`;

const newUI = `                    ))}
                  </ScrollView>
                  <TextInput value={customSubjectName} onChangeText={t => { setCustomSubjectName(t); if(t) setForm({...form, subjectId: ''}); }} placeholder="Or type new subject..." placeholderTextColor={colors.subText} style={[styles.input, { marginBottom: 15 }]} />
                  <Text style={[styles.inputLabel, { color: colors.subText }]}>Section</Text>`;

content = content.replace(oldUI, newUI);
fs.writeFileSync(file, content);
